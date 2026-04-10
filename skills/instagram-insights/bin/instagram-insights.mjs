#!/usr/bin/env node
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);

// src/index.ts
import "reflect-metadata";
import {
  command,
  commandOption,
  description,
  optionalArg,
  option,
  program,
  requiredArg,
  usage,
  version
} from "commander-ts";
import process3 from "node:process";

// src/auth-store.ts
import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// src/constants.ts
var DEFAULT_APP_URL = "https://project-qah0p.vercel.app";
var DEFAULT_STALE_AFTER_HOURS = 24;
var DEFAULT_CALLBACK_PORT = 8787;
var API_BEARER_SCOPE = "instagram-insights:api";

// src/auth-store.ts
function resolveBundleDir() {
  return path.dirname(fileURLToPath(import.meta.url));
}
function resolveSkillRoot() {
  const explicit = process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT;
  if (explicit) {
    return explicit;
  }
  return path.resolve(resolveBundleDir(), "..");
}
function resolveAuthDir() {
  return path.join(resolveSkillRoot(), ".auth");
}
function resolveAuthStatePath() {
  return path.join(resolveAuthDir(), "state.json");
}
function createEmptyState(appUrl = DEFAULT_APP_URL) {
  return {
    appUrl,
    clientId: null,
    redirectUri: null,
    accessToken: null,
    refreshToken: null,
    expiresAt: null
  };
}
async function readAuthState() {
  try {
    const raw = await readFile(resolveAuthStatePath(), "utf8");
    const parsed = JSON.parse(raw);
    return {
      ...createEmptyState(parsed.appUrl ?? DEFAULT_APP_URL),
      ...parsed
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return createEmptyState();
    }
    throw error;
  }
}
async function writeAuthState(state) {
  const authDir = resolveAuthDir();
  const target = resolveAuthStatePath();
  await mkdir(authDir, { recursive: true, mode: 448 });
  await chmod(authDir, 448).catch(() => void 0);
  await writeFile(target, JSON.stringify(state, null, 2), "utf8");
  await chmod(target, 384).catch(() => void 0);
}
async function clearAuthTokens() {
  await rm(resolveAuthDir(), { recursive: true, force: true });
}

// src/browser.ts
import { spawn } from "node:child_process";
import process2 from "node:process";
async function openBrowser(url) {
  const platform = process2.platform;
  if (platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  if (platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], {
      detached: true,
      stdio: "ignore"
    }).unref();
    return;
  }
  spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
}

// src/output.ts
function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}
function printText(text) {
  console.log(text);
}
function fail(message, details) {
  const payload = {
    error: message,
    ...details ?? {}
  };
  console.error(JSON.stringify(payload, null, 2));
  process.exit(1);
}

// src/oauth.ts
import crypto from "node:crypto";
import http from "node:http";
function sha256Base64Url(input) {
  return crypto.createHash("sha256").update(input).digest("base64url");
}
function randomBase64Url(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}
function normalizeAppUrl(appUrl) {
  return appUrl.replace(/\/+$/, "");
}
function buildLoopbackRedirectUri(port = DEFAULT_CALLBACK_PORT) {
  return `http://127.0.0.1:${port}/callback`;
}
async function registerPublicClient(input) {
  const response = await fetch(`${normalizeAppUrl(input.appUrl)}/oauth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_name: "Instagram Insights CLI",
      redirect_uris: [input.redirectUri],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      scope: API_BEARER_SCOPE
    })
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || !("client_id" in payload)) {
    fail("Unable to register CLI OAuth client.", {
      appUrl: input.appUrl,
      status: response.status,
      response: payload
    });
  }
  return payload;
}
async function exchangeAuthorizationCode(input) {
  const formData = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    code: input.code,
    code_verifier: input.codeVerifier
  });
  const response = await fetch(`${normalizeAppUrl(input.appUrl)}/oauth/token`, {
    method: "POST",
    body: formData
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || !("access_token" in payload)) {
    fail("OAuth code exchange failed.", {
      appUrl: input.appUrl,
      status: response.status,
      response: payload
    });
  }
  return payload;
}
async function refreshAccessToken(input) {
  const formData = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: input.clientId,
    refresh_token: input.refreshToken
  });
  const response = await fetch(`${normalizeAppUrl(input.appUrl)}/oauth/token`, {
    method: "POST",
    body: formData
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || !("access_token" in payload)) {
    fail("OAuth refresh failed.", {
      appUrl: input.appUrl,
      status: response.status,
      response: payload
    });
  }
  return payload;
}
async function waitForCallback(input) {
  const redirectUrl = new URL(input.redirectUri);
  const port = Number.parseInt(redirectUrl.port, 10);
  const hostname = redirectUrl.hostname;
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close(() => void 0);
      reject(new Error("Timed out waiting for OAuth callback."));
    }, 10 * 60 * 1e3);
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
          '<html><body style="font-family: system-ui; padding: 32px;">',
          "<h1>Instagram Insights CLI</h1>",
          error ? `<p>Authentication failed: ${error}</p>` : "<p>Authentication complete. You can return to the terminal.</p>",
          "</body></html>"
        ].join("")
      );
      clearTimeout(timeout);
      server.close(() => void 0);
      if (state !== input.expectedState) {
        reject(new Error("OAuth state mismatch."));
        return;
      }
      if (error) {
        resolve({
          code: null,
          state,
          error
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
        error: null
      });
    });
    server.once("error", reject);
    server.listen(port, hostname);
  });
}
async function runBrowserOAuthLogin(input) {
  const appUrl = normalizeAppUrl(input.appUrl);
  const redirectUri = input.currentState.redirectUri && !input.port ? input.currentState.redirectUri : buildLoopbackRedirectUri(input.port ?? DEFAULT_CALLBACK_PORT);
  const registration = input.currentState.clientId && input.currentState.redirectUri === redirectUri && normalizeAppUrl(input.currentState.appUrl) === appUrl ? { client_id: input.currentState.clientId } : await registerPublicClient({ appUrl, redirectUri });
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
    await openBrowser(authorizeUrl.toString());
  }
  const callback = await waitForCallback({
    redirectUri,
    expectedState: state
  });
  if (callback.error) {
    fail("OAuth authorize step failed.", {
      appUrl,
      authorizeUrl: authorizeUrl.toString(),
      error: callback.error
    });
  }
  if (!callback.code) {
    fail("OAuth authorize step did not return a code.", {
      appUrl,
      authorizeUrl: authorizeUrl.toString()
    });
  }
  const tokens = await exchangeAuthorizationCode({
    appUrl,
    clientId: registration.client_id,
    redirectUri,
    code: callback.code,
    codeVerifier
  });
  return {
    appUrl,
    clientId: registration.client_id,
    redirectUri,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? input.currentState.refreshToken,
    expiresAt: new Date(Date.now() + tokens.expires_in * 1e3).toISOString(),
    authorizeUrl: authorizeUrl.toString()
  };
}

// src/api-client.ts
function isExpired(expiresAt) {
  if (!expiresAt) {
    return true;
  }
  return Date.now() >= new Date(expiresAt).getTime() - 3e4;
}
var InstagramInsightsApiClient = class {
  appUrl;
  constructor(appUrl = DEFAULT_APP_URL) {
    this.appUrl = normalizeAppUrl(appUrl);
  }
  async getAuthState() {
    const state = await readAuthState();
    return {
      ...state,
      appUrl: this.appUrl
    };
  }
  async refreshIfNeeded(state) {
    if (!state.clientId || !state.refreshToken || !state.accessToken || !isExpired(state.expiresAt)) {
      return state;
    }
    const tokens = await refreshAccessToken({
      appUrl: this.appUrl,
      clientId: state.clientId,
      refreshToken: state.refreshToken
    });
    const nextState = {
      ...state,
      appUrl: this.appUrl,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? state.refreshToken,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1e3).toISOString()
    };
    await writeAuthState(nextState);
    return nextState;
  }
  async requireAuthenticatedState() {
    const state = await this.refreshIfNeeded(await this.getAuthState());
    if (!state.accessToken) {
      fail("Authentication required. Run `instagram-insights auth login` first.", {
        appUrl: this.appUrl,
        scope: API_BEARER_SCOPE
      });
    }
    return state;
  }
  async requestJson(path2, init, allowRetry = true) {
    const state = await this.requireAuthenticatedState();
    const response = await fetch(`${this.appUrl}${path2}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${state.accessToken}`,
        "Content-Type": "application/json",
        ...init?.headers ?? {}
      }
    });
    if (response.status === 401 && allowRetry && state.refreshToken && state.clientId) {
      const refreshed = await this.refreshIfNeeded({
        ...state,
        expiresAt: (/* @__PURE__ */ new Date(0)).toISOString()
      });
      return this.requestJson(path2, {
        ...init,
        headers: {
          ...init?.headers ?? {},
          Authorization: `Bearer ${refreshed.accessToken}`
        }
      }, false);
    }
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      fail("Instagram Insights API request failed.", {
        appUrl: this.appUrl,
        path: path2,
        status: response.status,
        response: payload
      });
    }
    return payload;
  }
  getAccountOverview() {
    return this.requestJson("/api/v1/account");
  }
  cleanReset() {
    return this.requestJson(
      "/api/v1/account/clean-reset",
      {
        method: "POST"
      }
    );
  }
  getLatestSnapshot() {
    return this.requestJson("/api/v1/snapshot/latest");
  }
  listMedia(searchParams) {
    return this.requestJson(`/api/v1/media?${searchParams.toString()}`);
  }
  getMedia(mediaId) {
    return this.requestJson(`/api/v1/media/${encodeURIComponent(mediaId)}`);
  }
  listSyncRuns(searchParams) {
    return this.requestJson(
      `/api/v1/sync-runs?${searchParams.toString()}`
    );
  }
  getSyncRun(syncRunId) {
    return this.requestJson(
      `/api/v1/sync-runs/${encodeURIComponent(syncRunId)}`
    );
  }
  triggerSync(payload) {
    return this.requestJson(
      "/api/v1/sync-runs",
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );
  }
};

// src/status.ts
function roundHours(hours) {
  return Number(hours.toFixed(1));
}
function deriveSetupStatus(input) {
  const latestSyncRun = input.overview.latestSyncRun;
  const instagramLinkUrl = new URL("/api/login", input.appUrl).toString();
  const developersUrl = new URL("/developers", input.appUrl).toString();
  const latestCompletedAt = latestSyncRun?.completedAt ?? null;
  const ageHours = latestCompletedAt ? roundHours(
    (Date.now() - new Date(latestCompletedAt).getTime()) / (60 * 60 * 1e3)
  ) : null;
  const isActiveSync = Boolean(
    latestSyncRun && ["queued", "running"].includes(latestSyncRun.status)
  );
  const isFresh = ageHours !== null && ageHours < input.staleAfterHours;
  if (!input.overview.account) {
    return {
      status: "not_linked",
      account: null,
      latestSyncRun,
      freshness: {
        staleAfterHours: input.staleAfterHours,
        isFresh: false,
        latestCompletedAt: null,
        ageHours: null,
        summary: "No Instagram account is linked yet."
      },
      instagramLinkUrl,
      developersUrl,
      recommendedNextAction: "connect_instagram",
      recommendedPrompt: "Run `instagram link --open` to connect Instagram, then rerun `setup status`."
    };
  }
  if (isActiveSync) {
    return {
      status: "syncing",
      account: input.overview.account,
      latestSyncRun,
      freshness: {
        staleAfterHours: input.staleAfterHours,
        isFresh: false,
        latestCompletedAt,
        ageHours,
        summary: `A sync is currently ${latestSyncRun?.status ?? "running"}.`
      },
      instagramLinkUrl,
      developersUrl,
      recommendedNextAction: "wait_for_sync",
      recommendedPrompt: latestSyncRun?.id ? `Run \`sync get ${latestSyncRun.id}\` or \`sync run --wait\`.` : "Check sync run status again before continuing."
    };
  }
  if (!latestCompletedAt) {
    return {
      status: "not_synced",
      account: input.overview.account,
      latestSyncRun,
      freshness: {
        staleAfterHours: input.staleAfterHours,
        isFresh: false,
        latestCompletedAt: null,
        ageHours: null,
        summary: "No completed sync is available yet."
      },
      instagramLinkUrl,
      developersUrl,
      recommendedNextAction: "trigger_sync",
      recommendedPrompt: `Run \`sync run --stale-after-hours ${input.staleAfterHours}\`.`
    };
  }
  if (!isFresh) {
    return {
      status: "stale",
      account: input.overview.account,
      latestSyncRun,
      freshness: {
        staleAfterHours: input.staleAfterHours,
        isFresh: false,
        latestCompletedAt,
        ageHours,
        summary: `The latest completed sync is ${ageHours ?? "unknown"} hours old.`
      },
      instagramLinkUrl,
      developersUrl,
      recommendedNextAction: "trigger_sync",
      recommendedPrompt: `Run \`sync run --stale-after-hours ${input.staleAfterHours}\`.`
    };
  }
  return {
    status: "ready",
    account: input.overview.account,
    latestSyncRun,
    freshness: {
      staleAfterHours: input.staleAfterHours,
      isFresh: true,
      latestCompletedAt,
      ageHours,
      summary: "The latest completed sync is fresh enough for analysis."
    },
    instagramLinkUrl,
    developersUrl,
    recommendedNextAction: "analyze",
    recommendedPrompt: "Run `snapshot latest` for account analysis, then `media list` or `media get <id>` for drilldowns."
  };
}

// src/index.ts
var CLI_VERSION = "1.0.0";
var CLI_ARGS = process3.argv.slice(2);
function parseOptionalInt(value, optionName) {
  if (value === void 0 || value === null || value === "") {
    return void 0;
  }
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) {
    fail(`Invalid ${optionName}.`, { value });
  }
  return parsed;
}
function getRootOptions(context) {
  const parentOpts = context.parent?.opts?.();
  return {
    appUrl: normalizeAppUrl(parentOpts?.appUrl ?? DEFAULT_APP_URL),
    json: parentOpts?.json === true,
    browser: parentOpts?.browser !== false
  };
}
async function runHandled(task) {
  try {
    await task();
  } catch (error) {
    fail(error instanceof Error ? error.message : "CLI command failed.");
  }
}
async function printPolledSyncRun(client, syncRunId) {
  while (true) {
    const detail = await client.getSyncRun(syncRunId);
    const status = detail.syncRun?.status;
    if (!status || !["queued", "running"].includes(status)) {
      printJson(detail);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 2e3));
  }
}
function printTopLevelHelp() {
  printText(
    [
      "Instagram Insights CLI",
      "",
      "Commands:",
      "  auth login [--port <n>]",
      "  auth status",
      "  auth logout",
      "  clean-reset",
      "  setup status [--stale-after-hours <n>] [--open-link]",
      "  account overview",
      "  snapshot latest",
      "  media list [--limit <n>] [--media-type <type>] [--since <iso>] [--until <iso>]",
      "  media get <mediaId>",
      "  sync list [--limit <n>]",
      "  sync get <syncRunId>",
      "  sync run [--force] [--stale-after-hours <n>] [--wait]",
      "  instagram link [--open]",
      "",
      "Global options:",
      "  --app-url <url>",
      "  --json",
      "  --no-browser"
    ].join("\n")
  );
}
var InstagramInsightsCli = class {
  async run() {
    if (CLI_ARGS.length === 0) {
      printTopLevelHelp();
    }
  }
  async auth(action) {
    await runHandled(async () => {
      const root = getRootOptions(this);
      if (action === "status") {
        const state = await readAuthState();
        printJson({
          authenticated: Boolean(state.accessToken),
          appUrl: root.appUrl,
          clientId: state.clientId,
          redirectUri: state.redirectUri,
          expiresAt: state.expiresAt,
          hasRefreshToken: Boolean(state.refreshToken)
        });
        return;
      }
      if (action === "logout") {
        await clearAuthTokens();
        printJson({
          loggedOut: true,
          appUrl: root.appUrl
        });
        return;
      }
      if (action === "login") {
        const currentState = await readAuthState();
        const port = parseOptionalInt(this.port, "port");
        const nextState = await runBrowserOAuthLogin({
          appUrl: root.appUrl,
          browser: root.browser,
          currentState: {
            ...currentState,
            appUrl: root.appUrl
          },
          port
        });
        await writeAuthState(nextState);
        printJson({
          authenticated: true,
          appUrl: nextState.appUrl,
          clientId: nextState.clientId,
          redirectUri: nextState.redirectUri,
          expiresAt: nextState.expiresAt
        });
        return;
      }
      fail("Unsupported auth action.", { action });
    });
  }
  async setup(action) {
    await runHandled(async () => {
      if (action !== "status") {
        fail("Unsupported setup action.", { action });
      }
      const root = getRootOptions(this);
      const staleAfterHours = parseOptionalInt(
        this.staleAfterHours,
        "stale-after-hours"
      ) ?? DEFAULT_STALE_AFTER_HOURS;
      const client = new InstagramInsightsApiClient(root.appUrl);
      const overview = await client.getAccountOverview();
      const setupStatus = deriveSetupStatus({
        overview,
        appUrl: root.appUrl,
        staleAfterHours
      });
      if (setupStatus.status === "not_linked" && this.openLink && root.browser) {
        await openBrowser(setupStatus.instagramLinkUrl);
      }
      printJson(setupStatus);
    });
  }
  async ["clean-reset"]() {
    await runHandled(async () => {
      const client = new InstagramInsightsApiClient(getRootOptions(this).appUrl);
      printJson(await client.cleanReset());
    });
  }
  async account(action) {
    await runHandled(async () => {
      if (action !== "overview") {
        fail("Unsupported account action.", { action });
      }
      const client = new InstagramInsightsApiClient(getRootOptions(this).appUrl);
      printJson(await client.getAccountOverview());
    });
  }
  async snapshot(action) {
    await runHandled(async () => {
      if (action !== "latest") {
        fail("Unsupported snapshot action.", { action });
      }
      const client = new InstagramInsightsApiClient(getRootOptions(this).appUrl);
      printJson(await client.getLatestSnapshot());
    });
  }
  async media(action, mediaId) {
    await runHandled(async () => {
      const client = new InstagramInsightsApiClient(getRootOptions(this).appUrl);
      if (action === "get") {
        if (!mediaId) {
          fail("media get requires a mediaId.");
        }
        printJson(await client.getMedia(mediaId));
        return;
      }
      if (action === "list") {
        const options = this;
        const searchParams = new URLSearchParams();
        const limit = parseOptionalInt(options.limit, "limit");
        if (limit) {
          searchParams.set("limit", String(limit));
        }
        if (options.mediaType) {
          searchParams.set("mediaType", options.mediaType);
        }
        if (options.since) {
          searchParams.set("since", options.since);
        }
        if (options.until) {
          searchParams.set("until", options.until);
        }
        printJson(await client.listMedia(searchParams));
        return;
      }
      fail("Unsupported media action.", { action });
    });
  }
  async sync(action, syncRunId) {
    await runHandled(async () => {
      const client = new InstagramInsightsApiClient(getRootOptions(this).appUrl);
      if (action === "list") {
        const limit = parseOptionalInt(
          this.limit,
          "limit"
        );
        const searchParams = new URLSearchParams();
        if (limit) {
          searchParams.set("limit", String(limit));
        }
        printJson(await client.listSyncRuns(searchParams));
        return;
      }
      if (action === "get") {
        if (!syncRunId) {
          fail("sync get requires a syncRunId.");
        }
        printJson(await client.getSyncRun(syncRunId));
        return;
      }
      if (action === "run") {
        const options = this;
        const payload = {
          force: options.force === true,
          staleAfterHours: parseOptionalInt(options.staleAfterHours, "stale-after-hours") ?? DEFAULT_STALE_AFTER_HOURS
        };
        const result = await client.triggerSync(payload);
        if (options.wait) {
          const queuedId = "syncRunId" in result ? result.syncRunId : "syncRun" in result && result.syncRun && typeof result.syncRun === "object" ? String(result.syncRun.id ?? "") : "";
          if (!queuedId) {
            printJson(result);
            return;
          }
          await printPolledSyncRun(client, queuedId);
          return;
        }
        printJson(result);
        return;
      }
      fail("Unsupported sync action.", { action });
    });
  }
  async instagram(action) {
    await runHandled(async () => {
      if (action !== "link") {
        fail("Unsupported instagram action.", { action });
      }
      const root = getRootOptions(this);
      const instagramLinkUrl = new URL("/api/login", root.appUrl).toString();
      const shouldOpen = root.browser && (this.open ?? true);
      if (shouldOpen) {
        await openBrowser(instagramLinkUrl);
      }
      printJson({
        instagramLinkUrl,
        openedInBrowser: shouldOpen
      });
    });
  }
};
__decorateClass([
  option("--app-url <url>", "Use a different Instagram Insights app URL")
], InstagramInsightsCli.prototype, "appUrl", 2);
__decorateClass([
  option("--json", "Accepted for compatibility; data commands already default to JSON")
], InstagramInsightsCli.prototype, "json", 2);
__decorateClass([
  option("--no-browser", "Disable automatic browser launch")
], InstagramInsightsCli.prototype, "browser", 2);
__decorateClass([
  command(),
  commandOption("--port <n>", "Use a specific localhost callback port"),
  __decorateParam(0, requiredArg("action"))
], InstagramInsightsCli.prototype, "auth", 1);
__decorateClass([
  command(),
  commandOption("--stale-after-hours <n>", "Freshness threshold in hours"),
  commandOption("--open-link", "Open the Instagram linking handoff when status is not_linked"),
  __decorateParam(0, requiredArg("action"))
], InstagramInsightsCli.prototype, "setup", 1);
__decorateClass([
  command()
], InstagramInsightsCli.prototype, "clean-reset", 1);
__decorateClass([
  command(),
  __decorateParam(0, requiredArg("action"))
], InstagramInsightsCli.prototype, "account", 1);
__decorateClass([
  command(),
  __decorateParam(0, requiredArg("action"))
], InstagramInsightsCli.prototype, "snapshot", 1);
__decorateClass([
  command(),
  commandOption("--limit <n>", "Maximum number of items to fetch"),
  commandOption("--media-type <type>", "Filter by media type"),
  commandOption("--since <iso>", "Only include media posted at or after this ISO timestamp"),
  commandOption("--until <iso>", "Only include media posted at or before this ISO timestamp"),
  __decorateParam(0, requiredArg("action")),
  __decorateParam(1, optionalArg("mediaId"))
], InstagramInsightsCli.prototype, "media", 1);
__decorateClass([
  command(),
  commandOption("--limit <n>", "Maximum number of sync runs to fetch"),
  commandOption("--force", "Force a new sync even when data is fresh"),
  commandOption("--stale-after-hours <n>", "Freshness threshold in hours"),
  commandOption("--wait", "Poll until the sync reaches a terminal state"),
  __decorateParam(0, requiredArg("action")),
  __decorateParam(1, optionalArg("syncRunId"))
], InstagramInsightsCli.prototype, "sync", 1);
__decorateClass([
  command(),
  commandOption("--open", "Open the Instagram linking handoff in the browser"),
  __decorateParam(0, requiredArg("action"))
], InstagramInsightsCli.prototype, "instagram", 1);
InstagramInsightsCli = __decorateClass([
  program(),
  version(CLI_VERSION),
  description("Instagram Insights skill CLI"),
  usage("[global options] <command> [subcommand]")
], InstagramInsightsCli);
new InstagramInsightsCli();
