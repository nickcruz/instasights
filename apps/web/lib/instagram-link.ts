import crypto from "node:crypto";

import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import type { ResponseCookies } from "next/dist/server/web/spec-extension/cookies";

import { getEnv } from "@/lib/env";

export type InstagramLink = {
  accessToken: string;
  instagramUserId: string;
  username: string;
  issuedAt: string;
  linkedAt: string;
  graphApiVersion: string;
  authAppUrl: string;
};

export const INSTAGRAM_LINK_COOKIE = "instagram_link";
export const INSTAGRAM_STATE_COOKIE = "instagram_oauth_state";

function shouldUseSecureCookies() {
  return process.env.NODE_ENV === "production";
}

function getEncryptionKey() {
  const secret =
    getEnv("AUTH_SECRET") ??
    getEnv("NEXTAUTH_SECRET") ??
    getEnv("INSTAGRAM_APP_SECRET");

  if (!secret) {
    throw new Error(
      "Missing AUTH_SECRET, NEXTAUTH_SECRET, or INSTAGRAM_APP_SECRET for Instagram link encryption.",
    );
  }

  return crypto.createHash("sha256").update(secret).digest();
}

function encodeBase64Url(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + "=".repeat(padding), "base64");
}

function sealInstagramLink(link: InstagramLink) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(link), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, ciphertext].map(encodeBase64Url).join(".");
}

function unsealInstagramLink(value: string) {
  const [ivPart, authTagPart, ciphertextPart] = value.split(".");

  if (!ivPart || !authTagPart || !ciphertextPart) {
    return null;
  }

  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      decodeBase64Url(ivPart),
    );
    decipher.setAuthTag(decodeBase64Url(authTagPart));

    const plaintext = Buffer.concat([
      decipher.update(decodeBase64Url(ciphertextPart)),
      decipher.final(),
    ]).toString("utf8");

    const payload = JSON.parse(plaintext) as InstagramLink;
    return payload;
  } catch {
    return null;
  }
}

export function setInstagramLinkCookie(
  cookies: ResponseCookies,
  link: InstagramLink,
) {
  cookies.set(INSTAGRAM_LINK_COOKIE, sealInstagramLink(link), {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearInstagramLinkCookie(cookies: ResponseCookies) {
  cookies.delete(INSTAGRAM_LINK_COOKIE);
}

export function getInstagramLink(
  cookies: Pick<ReadonlyRequestCookies, "get">,
) {
  const value = cookies.get(INSTAGRAM_LINK_COOKIE)?.value;

  if (!value) {
    return null;
  }

  return unsealInstagramLink(value);
}
