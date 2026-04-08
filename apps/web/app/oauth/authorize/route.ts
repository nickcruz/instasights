import { NextResponse } from "next/server";

import {
  createAuthorizationCodeForUser,
  getRegisteredOAuthClient,
  requireAuthorizedUserForOAuth,
} from "@/lib/mcp-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectWithOAuthError(input: {
  redirectUri?: string | null;
  error: string;
  errorDescription: string;
  state?: string | null;
}) {
  if (!input.redirectUri) {
    return Response.json(
      {
        error: input.error,
        error_description: input.errorDescription,
      },
      { status: 400 },
    );
  }

  const target = new URL(input.redirectUri);
  target.searchParams.set("error", input.error);
  target.searchParams.set("error_description", input.errorDescription);

  if (input.state) {
    target.searchParams.set("state", input.state);
  }

  return NextResponse.redirect(target.toString());
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get("client_id");
  const redirectUri = url.searchParams.get("redirect_uri");
  const state = url.searchParams.get("state");
  const codeChallenge = url.searchParams.get("code_challenge");
  const codeChallengeMethod =
    url.searchParams.get("code_challenge_method") ?? "plain";
  const scope = url.searchParams.get("scope");
  const resource = url.searchParams.get("resource");
  const responseType = url.searchParams.get("response_type") ?? "code";

  if (!clientId || !redirectUri || !codeChallenge) {
    return redirectWithOAuthError({
      redirectUri,
      state,
      error: "invalid_request",
      errorDescription:
        "Missing required client_id, redirect_uri, or code_challenge.",
    });
  }

  if (responseType !== "code") {
    return redirectWithOAuthError({
      redirectUri,
      state,
      error: "unsupported_response_type",
      errorDescription: "Only response_type=code is supported.",
    });
  }

  if (codeChallengeMethod !== "S256") {
    return redirectWithOAuthError({
      redirectUri,
      state,
      error: "invalid_request",
      errorDescription: "Only code_challenge_method=S256 is supported.",
    });
  }

  const client = await getRegisteredOAuthClient(clientId);

  if (!client) {
    return redirectWithOAuthError({
      redirectUri,
      state,
      error: "invalid_client",
      errorDescription: "Unknown client_id.",
    });
  }

  if (!client.redirectUris.includes(redirectUri)) {
    return redirectWithOAuthError({
      redirectUri,
      state,
      error: "invalid_request",
      errorDescription: "Unregistered redirect_uri.",
    });
  }

  const authResult = await requireAuthorizedUserForOAuth(request);

  if (!authResult.ok) {
    if (!authResult.signInUrl) {
      return Response.json(
        {
          error: "server_error",
          error_description: "Google auth is not configured.",
        },
        { status: 500 },
      );
    }

    return NextResponse.redirect(authResult.signInUrl.toString());
  }

  const code = await createAuthorizationCodeForUser({
    clientDbId: client.id,
    userId: authResult.userId,
    redirectUri,
    scope,
    resource,
    codeChallenge,
    codeChallengeMethod,
  });

  const target = new URL(redirectUri);
  target.searchParams.set("code", code);

  if (state) {
    target.searchParams.set("state", state);
  }

  return NextResponse.redirect(target.toString());
}
