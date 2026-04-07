import { getEnv, getRequiredEnv } from "@/lib/env";

type InstagramTokenResponse = {
  access_token?: string;
  user_id?: string;
  instagram_user_id?: string;
  error_message?: string;
  error?: {
    message?: string;
  };
};

type InstagramProfileResponse = {
  id?: string;
  user_id?: string;
  username?: string;
  error_message?: string;
  error?: {
    message?: string;
  };
};

type OAuthConfig = {
  appId: string;
  appSecret: string;
  appUrl: string;
  redirectUri: string;
  graphApiVersion: string;
};

function getOAuthConfig(): OAuthConfig {
  const appUrl = getRequiredEnv("INSTAGRAM_APP_URL");

  return {
    appId: getRequiredEnv("INSTAGRAM_APP_ID"),
    appSecret: getRequiredEnv("INSTAGRAM_APP_SECRET"),
    appUrl,
    redirectUri: getEnv("INSTAGRAM_REDIRECT_URI") ?? `${appUrl}/api/callback`,
    graphApiVersion: getEnv("GRAPH_API_VERSION") ?? "v25.0",
  };
}

export function isInstagramConfigured() {
  return Boolean(
    getEnv("INSTAGRAM_APP_ID") &&
      getEnv("INSTAGRAM_APP_SECRET") &&
      getEnv("INSTAGRAM_APP_URL"),
  );
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const payload = (await response.json()) as
    | (T & {
        error_message?: string;
        error?: { message?: string };
      })
    | null;

  if (!response.ok) {
    const message =
      payload?.error?.message ??
      payload?.error_message ??
      `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export function buildInstagramAuthorizeUrl(state: string) {
  const config = getOAuthConfig();
  const scope = [
    "instagram_business_basic",
    "instagram_business_manage_insights",
  ].join(",");

  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("force_reauth", "true");
  url.searchParams.set("state", state);

  return url;
}

export async function exchangeInstagramCode(code: string) {
  const config = getOAuthConfig();
  const form = new URLSearchParams();

  form.set("client_id", config.appId);
  form.set("client_secret", config.appSecret);
  form.set("grant_type", "authorization_code");
  form.set("redirect_uri", config.redirectUri);
  form.set("code", code);

  const tokenPayload = await fetchJson<InstagramTokenResponse>(
    "https://api.instagram.com/oauth/access_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    },
  );

  const accessToken = tokenPayload.access_token;
  const instagramUserId =
    tokenPayload.user_id ?? tokenPayload.instagram_user_id ?? "";

  if (!accessToken) {
    throw new Error("Instagram OAuth exchange did not return an access token.");
  }

  return {
    accessToken,
    instagramUserId,
    graphApiVersion: config.graphApiVersion,
    authAppUrl: config.appUrl,
    issuedAt: new Date().toISOString(),
  };
}

export async function fetchInstagramProfile(accessToken: string) {
  const profilePayload = await fetchJson<InstagramProfileResponse>(
    `https://graph.instagram.com/me?fields=user_id,username&access_token=${encodeURIComponent(accessToken)}`,
  );

  return {
    instagramUserId: profilePayload.user_id ?? profilePayload.id ?? "",
    username: profilePayload.username ?? "",
    rawProfile: profilePayload as Record<string, unknown>,
  };
}
