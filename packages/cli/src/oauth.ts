import crypto from "node:crypto";
import http from "node:http";

import { API_BEARER_SCOPE, DEFAULT_CALLBACK_PORT } from "./constants";
import { openBrowser } from "./browser";
import { fail, logRuntime } from "./output";
import type {
  OAuthClientRegistration,
  OAuthTokenResponse,
  StoredAuthState,
} from "./types";

function sha256Base64Url(input: string) {
  return crypto.createHash("sha256").update(input).digest("base64url");
}

function randomBase64Url(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export const OAUTH_CALLBACK_TIMEOUT_MS = 5 * 60 * 1000;

export function normalizeAppUrl(appUrl: string) {
  return appUrl.replace(/\/+$/, "");
}

export function buildLoopbackRedirectUri(port = DEFAULT_CALLBACK_PORT) {
  return `http://127.0.0.1:${port}/callback`;
}

export async function registerPublicClient(input: {
  appUrl: string;
  redirectUri: string;
}) {
  logRuntime("Registering the CLI OAuth client with the hosted app...", {
    appUrl: input.appUrl,
    redirectUri: input.redirectUri,
  });

  const response = await fetch(`${normalizeAppUrl(input.appUrl)}/oauth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_name: "Instasights CLI",
      redirect_uris: [input.redirectUri],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      scope: API_BEARER_SCOPE,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | OAuthClientRegistration
    | { error?: string; error_description?: string }
    | null;

  if (!response.ok || !payload || !("client_id" in payload)) {
    fail("Unable to register CLI OAuth client.", {
      appUrl: input.appUrl,
      status: response.status,
      response: payload,
    });
  }

  return payload;
}

export async function exchangeAuthorizationCode(input: {
  appUrl: string;
  clientId: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
}) {
  logRuntime("Exchanging the OAuth authorization code for API tokens...");

  const formData = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    code: input.code,
    code_verifier: input.codeVerifier,
  });

  const response = await fetch(`${normalizeAppUrl(input.appUrl)}/oauth/token`, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as
    | OAuthTokenResponse
    | { error?: string; error_description?: string }
    | null;

  if (!response.ok || !payload || !("access_token" in payload)) {
    fail("OAuth code exchange failed.", {
      appUrl: input.appUrl,
      status: response.status,
      response: payload,
    });
  }

  return payload;
}

export async function refreshAccessToken(input: {
  appUrl: string;
  clientId: string;
  refreshToken: string;
}) {
  logRuntime("Requesting a refreshed OAuth access token...");

  const formData = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: input.clientId,
    refresh_token: input.refreshToken,
  });

  const response = await fetch(`${normalizeAppUrl(input.appUrl)}/oauth/token`, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as
    | OAuthTokenResponse
    | { error?: string; error_description?: string }
    | null;

  if (!response.ok || !payload || !("access_token" in payload)) {
    fail("OAuth refresh failed.", {
      appUrl: input.appUrl,
      status: response.status,
      response: payload,
    });
  }

  return payload;
}

type CallbackResult =
  | {
      code: string;
      state: string | null;
      error: null;
    }
  | {
      code: null;
      state: string | null;
      error: string;
    };

export async function waitForCallback(input: {
  redirectUri: string;
  expectedState: string;
  timeoutMs?: number;
}) {
  const redirectUrl = new URL(input.redirectUri);
  const port = Number.parseInt(redirectUrl.port, 10);
  const hostname = redirectUrl.hostname;
  const timeoutMs = input.timeoutMs ?? OAUTH_CALLBACK_TIMEOUT_MS;

  return await new Promise<CallbackResult>((resolve, reject) => {
    logRuntime("Waiting for Google sign-in to finish in the browser...", {
      authorizeStep: "pending_browser_login",
      redirectUri: input.redirectUri,
      timeoutMinutes: timeoutMs / 60_000,
    });

    const timeout = setTimeout(() => {
      server.close(() => undefined);
      reject(new Error("Timed out waiting for Google sign-in to finish in the browser."));
    }, timeoutMs);

    const server = http.createServer((request, response) => {
      const requestUrl = new URL(request.url ?? "/", input.redirectUri);
      const code = requestUrl.searchParams.get("code");
      const state = requestUrl.searchParams.get("state");
      const error = requestUrl.searchParams.get("error");

      response.statusCode = 200;
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.end(
        [
          "<!doctype html>",
          "<html><body style=\"font-family: system-ui; padding: 32px;\">",
          "<h1>Instasights CLI</h1>",
          error
            ? `<p>Authentication failed: ${error}</p>`
            : "<p>Authentication complete. You can return to the terminal.</p>",
          "</body></html>",
        ].join(""),
      );

      clearTimeout(timeout);
      server.close(() => undefined);

      if (state !== input.expectedState) {
        reject(new Error("OAuth state mismatch."));
        return;
      }

      if (error) {
        resolve({
          code: null,
          state,
          error,
        });
        return;
      }

      if (!code) {
        reject(new Error("OAuth callback did not include an authorization code."));
        return;
      }

      resolve({
        code,
        state,
        error: null,
      });
    });

    server.once("error", reject);
    server.listen(port, hostname);
  });
}

export async function runBrowserOAuthLogin(input: {
  appUrl: string;
  browser: boolean;
  currentState: StoredAuthState;
  port?: number;
}) {
  const appUrl = normalizeAppUrl(input.appUrl);
  const redirectUri =
    input.currentState.redirectUri && !input.port
      ? input.currentState.redirectUri
      : buildLoopbackRedirectUri(input.port ?? DEFAULT_CALLBACK_PORT);

  const registration =
    input.currentState.clientId &&
    input.currentState.redirectUri === redirectUri &&
    normalizeAppUrl(input.currentState.appUrl) === appUrl
      ? { client_id: input.currentState.clientId }
      : await registerPublicClient({ appUrl, redirectUri });

  if (registration.client_id === input.currentState.clientId) {
    logRuntime("Reusing the existing CLI OAuth client registration.");
  }

  const codeVerifier = randomBase64Url(48);
  const codeChallenge = sha256Base64Url(codeVerifier);
  const state = randomBase64Url(24);
  const authorizeUrl = new URL(`${appUrl}/oauth/authorize`);

  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", registration.client_id);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", API_BEARER_SCOPE);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("state", state);

  if (input.browser) {
    logRuntime("Opening the OAuth authorization page in the browser.");
    await openBrowser(authorizeUrl.toString());
  } else {
    logRuntime("Browser launch is disabled; use this URL to continue the OAuth flow.", {
      authorizeUrl: authorizeUrl.toString(),
    });
  }

  logRuntime("The CLI will keep waiting here until the browser login finishes or the timeout is reached.", {
    redirectUri,
    timeoutMinutes: OAUTH_CALLBACK_TIMEOUT_MS / 60_000,
  });

  const callback = await waitForCallback({
    redirectUri,
    expectedState: state,
    timeoutMs: OAUTH_CALLBACK_TIMEOUT_MS,
  });

  logRuntime("OAuth callback received; finalizing login.");

  if (callback.error) {
    fail("OAuth authorize step failed.", {
      appUrl,
      authorizeUrl: authorizeUrl.toString(),
      error: callback.error,
    });
  }

  if (!callback.code) {
    fail("OAuth authorize step did not return a code.", {
      appUrl,
      authorizeUrl: authorizeUrl.toString(),
    });
  }

  const tokens = await exchangeAuthorizationCode({
    appUrl,
    clientId: registration.client_id,
    redirectUri,
    code: callback.code,
    codeVerifier,
  });

  return {
    appUrl,
    clientId: registration.client_id,
    redirectUri,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? input.currentState.refreshToken,
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    authorizeUrl: authorizeUrl.toString(),
  };
}
