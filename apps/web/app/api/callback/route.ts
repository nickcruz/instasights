import {
  upsertInstagramAccount,
} from "@instagram-insights/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  clearInstagramLinkCookie,
  INSTAGRAM_STATE_COOKIE,
} from "@/lib/instagram-link";
import {
  exchangeInstagramCode,
  fetchInstagramProfile,
  isInstagramConfigured,
} from "@/lib/instagram-oauth";

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!session || !userId) {
    return NextResponse.redirect(new URL("/?auth=required", request.url), {
      status: 302,
    });
  }

  if (!isInstagramConfigured()) {
    return NextResponse.redirect(
      new URL("/profile?instagram=config-error", request.url),
      {
        status: 302,
      },
    );
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(INSTAGRAM_STATE_COOKIE)?.value;

  if (error) {
    const response = NextResponse.redirect(
      new URL(
        `/profile?instagram=error&message=${encodeURIComponent(error)}`,
        request.url,
      ),
      { status: 302 },
    );
    response.cookies.delete(INSTAGRAM_STATE_COOKIE);
    return response;
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    const response = NextResponse.redirect(
      new URL("/profile?instagram=state-error", request.url),
      { status: 302 },
    );
    response.cookies.delete(INSTAGRAM_STATE_COOKIE);
    clearInstagramLinkCookie(response.cookies);
    return response;
  }

  try {
    const tokenPayload = await exchangeInstagramCode(code);
    const profile = await fetchInstagramProfile(tokenPayload.accessToken);
    await upsertInstagramAccount({
      userId,
      instagramUserId:
        profile.instagramUserId || tokenPayload.instagramUserId || "",
      username: profile.username,
      accessToken: tokenPayload.accessToken,
      graphApiVersion: tokenPayload.graphApiVersion,
      authAppUrl: tokenPayload.authAppUrl,
      tokenIssuedAt: new Date(tokenPayload.issuedAt ?? new Date().toISOString()),
      linkedAt: new Date(),
      rawProfile: profile.rawProfile,
    });
    const response = NextResponse.redirect(
      new URL("/profile?instagram=linked", request.url),
      { status: 302 },
    );

    response.cookies.delete(INSTAGRAM_STATE_COOKIE);
    clearInstagramLinkCookie(response.cookies);

    return response;
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Instagram OAuth failed.";
    const response = NextResponse.redirect(
      new URL(
        `/profile?instagram=error&message=${encodeURIComponent(message)}`,
        request.url,
      ),
      { status: 302 },
    );

    response.cookies.delete(INSTAGRAM_STATE_COOKIE);
    clearInstagramLinkCookie(response.cookies);

    return response;
  }
}
