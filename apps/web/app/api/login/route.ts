import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  buildInstagramAuthorizeUrl,
  isInstagramConfigured,
} from "@/lib/instagram-oauth";
import { INSTAGRAM_STATE_COOKIE } from "@/lib/instagram-link";
import { buildRootHandoffPath } from "@/lib/return-to";

export async function GET(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.redirect(
      new URL(buildRootHandoffPath("/api/login"), request.url),
      { status: 302 },
    );
  }

  if (!isInstagramConfigured()) {
    return NextResponse.redirect(
      new URL("/auth/complete?status=config-error", request.url),
      {
        status: 302,
      },
    );
  }

  const state = crypto.randomBytes(24).toString("hex");
  const authorizeUrl = buildInstagramAuthorizeUrl(state);
  const response = NextResponse.redirect(authorizeUrl, { status: 302 });

  response.cookies.set(INSTAGRAM_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
