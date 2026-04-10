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
  version,
  type Command,
} from "commander-ts";
import process from "node:process";

import { clearAuthTokens, readAuthState, writeAuthState } from "./auth-store";
import { DEFAULT_APP_URL, DEFAULT_STALE_AFTER_HOURS } from "./constants";
import { openBrowser } from "./browser";
import { InstagramInsightsApiClient } from "./api-client";
import { fail, printJson, printText } from "./output";
import { normalizeAppUrl, runBrowserOAuthLogin } from "./oauth";
import { deriveSetupStatus } from "./status";

const CLI_VERSION = "1.0.0";
const CLI_ARGS = process.argv.slice(2);

type RootCommand = Command & {
  appUrl?: string;
  json?: boolean;
  browser?: boolean;
  parent?: RootCommand;
};

function parseOptionalInt(value: unknown, optionName: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed)) {
    fail(`Invalid ${optionName}.`, { value });
  }

  return parsed;
}

function getRootOptions(context: RootCommand) {
  const parentOpts = context.parent?.opts?.() as
    | { appUrl?: string; json?: boolean; browser?: boolean }
    | undefined;

  return {
    appUrl: normalizeAppUrl(parentOpts?.appUrl ?? DEFAULT_APP_URL),
    json: parentOpts?.json === true,
    browser: parentOpts?.browser !== false,
  };
}

async function runHandled(task: () => Promise<void>) {
  try {
    await task();
  } catch (error) {
    fail(error instanceof Error ? error.message : "CLI command failed.");
  }
}

async function printPolledSyncRun(
  client: InstagramInsightsApiClient,
  syncRunId: string,
) {
  while (true) {
    const detail = await client.getSyncRun(syncRunId);
    const status = detail.syncRun?.status;

    if (!status || !["queued", "running"].includes(status)) {
      printJson(detail);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
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
      "  --no-browser",
    ].join("\n"),
  );
}

@program()
@version(CLI_VERSION)
@description("Instagram Insights skill CLI")
@usage("[global options] <command> [subcommand]")
class InstagramInsightsCli {
  @option("--app-url <url>", "Use a different Instagram Insights app URL")
  declare appUrl: string;

  @option("--json", "Accepted for compatibility; data commands already default to JSON")
  declare json: boolean;

  @option("--no-browser", "Disable automatic browser launch")
  declare browser: boolean;

  async run() {
    if (CLI_ARGS.length === 0) {
      printTopLevelHelp();
    }
  }

  @command()
  @commandOption("--port <n>", "Use a specific localhost callback port")
  async auth(this: RootCommand, @requiredArg("action") action: string) {
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
          hasRefreshToken: Boolean(state.refreshToken),
        });
        return;
      }

      if (action === "logout") {
        await clearAuthTokens();
        printJson({
          loggedOut: true,
          appUrl: root.appUrl,
        });
        return;
      }

      if (action === "login") {
        const currentState = await readAuthState();
        const port = parseOptionalInt((this as RootCommand & { port?: string }).port, "port");
        const nextState = await runBrowserOAuthLogin({
          appUrl: root.appUrl,
          browser: root.browser,
          currentState: {
            ...currentState,
            appUrl: root.appUrl,
          },
          port,
        });

        await writeAuthState(nextState);
        printJson({
          authenticated: true,
          appUrl: nextState.appUrl,
          clientId: nextState.clientId,
          redirectUri: nextState.redirectUri,
          expiresAt: nextState.expiresAt,
        });
        return;
      }

      fail("Unsupported auth action.", { action });
    });
  }

  @command()
  @commandOption("--stale-after-hours <n>", "Freshness threshold in hours")
  @commandOption("--open-link", "Open the Instagram linking handoff when status is not_linked")
  async setup(this: RootCommand, @requiredArg("action") action: string) {
    await runHandled(async () => {
      if (action !== "status") {
        fail("Unsupported setup action.", { action });
      }

      const root = getRootOptions(this);
      const staleAfterHours =
        parseOptionalInt(
          (this as RootCommand & { staleAfterHours?: string }).staleAfterHours,
          "stale-after-hours",
        ) ?? DEFAULT_STALE_AFTER_HOURS;
      const client = new InstagramInsightsApiClient(root.appUrl);
      const overview = await client.getAccountOverview();
      const setupStatus = deriveSetupStatus({
        overview,
        appUrl: root.appUrl,
        staleAfterHours,
      });

      if (
        setupStatus.status === "not_linked" &&
        (this as RootCommand & { openLink?: boolean }).openLink &&
        root.browser
      ) {
        await openBrowser(setupStatus.instagramLinkUrl);
      }

      printJson(setupStatus);
    });
  }

  @command()
  async ["clean-reset"](this: RootCommand) {
    await runHandled(async () => {
      const client = new InstagramInsightsApiClient(getRootOptions(this).appUrl);
      printJson(await client.cleanReset());
    });
  }

  @command()
  async account(this: RootCommand, @requiredArg("action") action: string) {
    await runHandled(async () => {
      if (action !== "overview") {
        fail("Unsupported account action.", { action });
      }

      const client = new InstagramInsightsApiClient(getRootOptions(this).appUrl);
      printJson(await client.getAccountOverview());
    });
  }

  @command()
  async snapshot(this: RootCommand, @requiredArg("action") action: string) {
    await runHandled(async () => {
      if (action !== "latest") {
        fail("Unsupported snapshot action.", { action });
      }

      const client = new InstagramInsightsApiClient(getRootOptions(this).appUrl);
      printJson(await client.getLatestSnapshot());
    });
  }

  @command()
  @commandOption("--limit <n>", "Maximum number of items to fetch")
  @commandOption("--media-type <type>", "Filter by media type")
  @commandOption("--since <iso>", "Only include media posted at or after this ISO timestamp")
  @commandOption("--until <iso>", "Only include media posted at or before this ISO timestamp")
  async media(
    this: RootCommand,
    @requiredArg("action") action: string,
    @optionalArg("mediaId") mediaId?: string,
  ) {
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
        const options = this as RootCommand & {
          limit?: string;
          mediaType?: string;
          since?: string;
          until?: string;
        };
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

  @command()
  @commandOption("--limit <n>", "Maximum number of sync runs to fetch")
  @commandOption("--force", "Force a new sync even when data is fresh")
  @commandOption("--stale-after-hours <n>", "Freshness threshold in hours")
  @commandOption("--wait", "Poll until the sync reaches a terminal state")
  async sync(
    this: RootCommand,
    @requiredArg("action") action: string,
    @optionalArg("syncRunId") syncRunId?: string,
  ) {
    await runHandled(async () => {
      const client = new InstagramInsightsApiClient(getRootOptions(this).appUrl);

      if (action === "list") {
        const limit = parseOptionalInt(
          (this as RootCommand & { limit?: string }).limit,
          "limit",
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
        const options = this as RootCommand & {
          force?: boolean;
          wait?: boolean;
          staleAfterHours?: string;
        };
        const payload = {
          force: options.force === true,
          staleAfterHours:
            parseOptionalInt(options.staleAfterHours, "stale-after-hours") ??
            DEFAULT_STALE_AFTER_HOURS,
        };
        const result = await client.triggerSync(payload);

        if (options.wait) {
          const queuedId =
            "syncRunId" in result
              ? result.syncRunId
              : "syncRun" in result && result.syncRun && typeof result.syncRun === "object"
                ? String((result.syncRun as { id?: string }).id ?? "")
                : "";

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

  @command()
  @commandOption("--open", "Open the Instagram linking handoff in the browser")
  async instagram(this: RootCommand, @requiredArg("action") action: string) {
    await runHandled(async () => {
      if (action !== "link") {
        fail("Unsupported instagram action.", { action });
      }

      const root = getRootOptions(this);
      const instagramLinkUrl = new URL("/api/login", root.appUrl).toString();
      const shouldOpen =
        root.browser && ((this as RootCommand & { open?: boolean }).open ?? true);

      if (shouldOpen) {
        await openBrowser(instagramLinkUrl);
      }

      printJson({
        instagramLinkUrl,
        openedInBrowser: shouldOpen,
      });
    });
  }
}

new InstagramInsightsCli();
