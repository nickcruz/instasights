import { consumeMcpOAuthAuthorizationCode, getMcpOAuthClientByClientId } from "@instagram-insights/db";

import {
  exchangeRefreshToken,
  hashOpaqueSecret,
  issueOAuthTokenPair,
  verifyPkceCodeVerifier,
} from "@/lib/mcp-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
} as const;

function errorResponse(
  error: string,
  errorDescription: string,
  status = 400,
) {
  return Response.json(
    {
      error,
      error_description: errorDescription,
    },
    {
      status,
      headers: CORS_HEADERS,
    },
  );
}

async function authenticateClient(formData: URLSearchParams) {
  const clientId = formData.get("client_id");
  const clientSecret = formData.get("client_secret");

  if (!clientId) {
    return {
      ok: false as const,
      response: errorResponse("invalid_request", "Missing client_id."),
    };
  }

  const client = await getMcpOAuthClientByClientId(clientId);

  if (!client) {
    return {
      ok: false as const,
      response: errorResponse("invalid_client", "Unknown client_id."),
    };
  }

  if (client.tokenEndpointAuthMethod === "none") {
    return {
      ok: true as const,
      client,
    };
  }

  if (!clientSecret) {
    return {
      ok: false as const,
      response: errorResponse(
        "invalid_client",
        "Client secret is required for this client.",
      ),
    };
  }

  if (client.clientSecretHash !== hashOpaqueSecret(clientSecret)) {
    return {
      ok: false as const,
      response: errorResponse("invalid_client", "Invalid client_secret."),
    };
  }

  return {
    ok: true as const,
    client,
  };
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const params = new URLSearchParams();

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      params.append(key, value);
    }
  }

  const grantType = params.get("grant_type");
  const authResult = await authenticateClient(params);

  if (!authResult.ok) {
    return authResult.response;
  }

  const client = authResult.client;

  if (grantType === "authorization_code") {
    const code = params.get("code");
    const codeVerifier = params.get("code_verifier");
    const redirectUri = params.get("redirect_uri");

    if (!code || !codeVerifier) {
      return errorResponse(
        "invalid_request",
        "Missing code or code_verifier for authorization_code flow.",
      );
    }

    const authorizationCode = await consumeMcpOAuthAuthorizationCode(
      hashOpaqueSecret(code),
    );

    if (!authorizationCode) {
      return errorResponse("invalid_grant", "Invalid or expired authorization code.");
    }

    if (authorizationCode.client.id !== client.id) {
      return errorResponse(
        "invalid_grant",
        "Authorization code was not issued to this client.",
      );
    }

    if (authorizationCode.code.redirectUri !== redirectUri) {
      return errorResponse("invalid_grant", "redirect_uri mismatch.");
    }

    if (
      !verifyPkceCodeVerifier({
        codeVerifier,
        codeChallenge: authorizationCode.code.codeChallenge,
        method: authorizationCode.code.codeChallengeMethod,
      })
    ) {
      return errorResponse("invalid_grant", "code_verifier mismatch.");
    }

    const tokens = await issueOAuthTokenPair({
      clientDbId: client.id,
      userId: authorizationCode.code.userId,
      scope: authorizationCode.code.scope ?? undefined,
      resource: authorizationCode.code.resource ?? undefined,
    });

    return Response.json(tokens, {
      headers: CORS_HEADERS,
    });
  }

  if (grantType === "refresh_token") {
    const refreshToken = params.get("refresh_token");

    if (!refreshToken) {
      return errorResponse("invalid_request", "Missing refresh_token.");
    }

    const tokens = await exchangeRefreshToken({
      refreshToken,
      clientDbId: client.id,
    });

    if (!tokens) {
      return errorResponse("invalid_grant", "Invalid or expired refresh token.");
    }

    return Response.json(tokens, {
      headers: CORS_HEADERS,
    });
  }

  return errorResponse(
    "unsupported_grant_type",
    "Only authorization_code and refresh_token are supported.",
  );
}
