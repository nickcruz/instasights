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
import { openBrowser } from "./browser";
import { DEFAULT_APP_URL, DEFAULT_STALE_AFTER_HOURS } from "./constants";
import { InstasightsApiClient } from "./api-client";
import { buildMediaListSearchParams } from "./media-query";
import {
  fail,
  logRuntime,
  printJson,
  printText,
  runWithRuntimeLogging,
} from "./output";
import { normalizeAppUrl, runBrowserOAuthLogin } from "./oauth";
import { generateHtmlReport } from "./report-generator";
import { paginateReportResponse } from "./report-pagination";
import { deriveSetupStatus } from "./status";
import { logSyncRunQueued, waitForSyncRun } from "./sync-logging";
import { applyUpdate, checkForUpdates } from "./updater";
import { getCliVersion } from "./version";

const CLI_VERSION = getCliVersion();
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

function printTopLevelHelp() {
  printText(
    [
      "Instasights CLI",
      "",
      "Commands:",
      "  auth login [--port <n>]",
      "  auth status",
      "  auth logout",
      "  clean-reset",
      "  setup status [--stale-after-hours <n>] [--open-link]",
      "  account overview",
      "  snapshot latest",
      "  media list [--limit <n>] [--media-type <type>] [--since <iso>] [--until <iso>] [--days <n>] [--flat-metrics]",
      "  media get <mediaId>",
      "  media analyze [--days <n>] [--paginate <page>] [--page-size <n>]",
      "  report generate [--days <n>] [--output <path>]",
      "  sync list [--limit <n>]",
      "  sync get <syncRunId>",
      "  sync run [--force] [--stale-after-hours <n>] [--wait]",
      "  instagram link [--open]",
      "  update check [--apply] [--force]",
      "  update apply [--force]",
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
@description("Instasights skill CLI")
@usage("[global options] <command> [subcommand]")
class InstasightsCli {
  @option("--app-url <url>", "Use a different Instasights app URL")
  declare appUrl: string;

  @option("--json", "Legacy compatibility flag; data commands already default to JSON")
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
        const state = await runWithRuntimeLogging("Checking local authentication status", async () =>
          readAuthState(),
        );
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
        await runWithRuntimeLogging("Clearing local authentication state", async () =>
          clearAuthTokens(),
        );
        printJson({
          loggedOut: true,
          appUrl: root.appUrl,
        });
        return;
      }

      if (action === "login") {
        const currentState = await runWithRuntimeLogging(
          "Loading current OAuth state",
          async () => readAuthState(),
        );
        const port = parseOptionalInt((this as RootCommand & { port?: string }).port, "port");
        const nextState = await runWithRuntimeLogging("Starting browser OAuth login", async () =>
          runBrowserOAuthLogin({
            appUrl: root.appUrl,
            browser: root.browser,
            currentState: {
              ...currentState,
              appUrl: root.appUrl,
            },
            port,
          }),
        );

        await runWithRuntimeLogging("Persisting refreshed local OAuth state", async () =>
          writeAuthState(nextState),
        );
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
      const client = new InstasightsApiClient(root.appUrl);
      const setupStatus = await runWithRuntimeLogging(
        "Evaluating Instagram setup status",
        async () => {
          const overview = await client.getAccountOverview();
          return deriveSetupStatus({
            overview,
            appUrl: root.appUrl,
            staleAfterHours,
          });
        },
      );

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
      const root = getRootOptions(this);
      const client = new InstasightsApiClient(root.appUrl);
      printJson(
        await runWithRuntimeLogging(
          "Clearing linked Instagram data while keeping the CLI logged in",
          async () => client.cleanReset(),
        ),
      );
    });
  }

  @command()
  async account(this: RootCommand, @requiredArg("action") action: string) {
    await runHandled(async () => {
      if (action !== "overview") {
        fail("Unsupported account action.", { action });
      }

      const root = getRootOptions(this);
      const client = new InstasightsApiClient(root.appUrl);
      printJson(
        await runWithRuntimeLogging("Fetching account overview", async () =>
          client.getAccountOverview(),
        ),
      );
    });
  }

  @command()
  async snapshot(this: RootCommand, @requiredArg("action") action: string) {
    await runHandled(async () => {
      if (action !== "latest") {
        fail("Unsupported snapshot action.", { action });
      }

      const root = getRootOptions(this);
      const client = new InstasightsApiClient(root.appUrl);
      printJson(
        await runWithRuntimeLogging("Fetching the latest synced snapshot", async () =>
          client.getLatestSnapshot(),
        ),
      );
    });
  }

  @command()
  @commandOption("--limit <n>", "Maximum number of items to fetch")
  @commandOption("--media-type <type>", "Filter by media type")
  @commandOption("--since <iso>", "Only include media posted at or after this ISO timestamp")
  @commandOption("--until <iso>", "Only include media posted at or before this ISO timestamp")
  @commandOption("--days <n>", "Only include media from the trailing N days")
  @commandOption("--flat-metrics", "Include stored flat metrics and analysis fields")
  @commandOption("--paginate <page>", "Paginate large analysis arrays for easier machine parsing")
  @commandOption("--page-size <n>", "Number of items per page when --paginate is used")
  async media(
    this: RootCommand,
    @requiredArg("action") action: string,
    @optionalArg("mediaId") mediaId?: string,
  ) {
    await runHandled(async () => {
      const root = getRootOptions(this);
      const client = new InstasightsApiClient(root.appUrl);

      if (action === "get") {
        if (!mediaId) {
          fail("media get requires a mediaId.");
        }

        printJson(
          await runWithRuntimeLogging(`Fetching media item ${mediaId}`, async () =>
            client.getMedia(mediaId),
          ),
        );
        return;
      }

      if (action === "list") {
        const options = this as RootCommand & {
          limit?: string;
          mediaType?: string;
          since?: string;
          until?: string;
          days?: string;
          flatMetrics?: boolean;
        };
        const limit = parseOptionalInt(options.limit, "limit");
        const days = parseOptionalInt(options.days, "days");

        const searchParams = buildMediaListSearchParams({
          limit,
          mediaType: options.mediaType,
          since: options.since,
          until: options.until,
          days: days ?? undefined,
          flatMetrics: options.flatMetrics === true,
        });

        printJson(
          await runWithRuntimeLogging("Listing synced media", async () =>
            client.listMedia(searchParams),
          ),
        );
        return;
      }

      if (action === "analyze") {
        const days = parseOptionalInt(
          (this as RootCommand & { days?: string }).days,
          "days",
        ) ?? 30;
        const page = parseOptionalInt(
          (this as RootCommand & { paginate?: string }).paginate,
          "paginate",
        );
        const pageSize =
          parseOptionalInt(
            (this as RootCommand & { pageSize?: string }).pageSize,
            "page-size",
          ) ?? 10;

        if (days !== 30) {
          fail("media analyze currently supports only --days 30.", { days });
        }

        if (page !== undefined && page < 1) {
          fail("--paginate must be 1 or greater.", { page });
        }

        if (pageSize < 1) {
          fail("--page-size must be 1 or greater.", { pageSize });
        }

        const reportResponse = await runWithRuntimeLogging(
          `Fetching the ${days}-day media analysis report`,
          async () => client.getReport(days),
        );

        printJson(
          page === undefined
            ? reportResponse
            : paginateReportResponse(reportResponse, page, pageSize),
        );
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
      const root = getRootOptions(this);
      const client = new InstasightsApiClient(root.appUrl);

      if (action === "list") {
        const limit = parseOptionalInt(
          (this as RootCommand & { limit?: string }).limit,
          "limit",
        );
        const searchParams = new URLSearchParams();

        if (limit) {
          searchParams.set("limit", String(limit));
        }

        printJson(
          await runWithRuntimeLogging("Listing recent sync runs", async () =>
            client.listSyncRuns(searchParams),
          ),
        );
        return;
      }

      if (action === "get") {
        if (!syncRunId) {
          fail("sync get requires a syncRunId.");
        }

        printJson(
          await runWithRuntimeLogging(`Fetching sync run ${syncRunId}`, async () =>
            client.getSyncRun(syncRunId),
          ),
        );
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
        const result = await runWithRuntimeLogging("Submitting the sync request", async () =>
          client.triggerSync(payload),
        );

        if (options.wait) {
          const syncRun = "syncRun" in result ? result.syncRun : null;
          const queuedId = "syncRunId" in result ? result.syncRunId : syncRun?.id ?? "";

          logSyncRunQueued({
            queuedNewRun: result.queuedNewRun,
            reusedExistingRun: result.reusedExistingRun,
            syncRun,
            syncRunId: "syncRunId" in result ? result.syncRunId : undefined,
            reason: "reason" in result ? result.reason : undefined,
          });

          if (!queuedId) {
            printJson(result);
            return;
          }

          logRuntime(
            "Polling sync status every 1 second and printing full sync status updates until the run completes.",
          );
          await waitForSyncRun({
            client,
            syncRunId: queuedId,
            pollIntervalMs: 1_000,
            onPoll: (detail) => {
              printJson(detail);
            },
          });
          return;
        }

        printJson(result);
        return;
      }

      fail("Unsupported sync action.", { action });
    });
  }

  @command()
  @commandOption("--days <n>", "Report window in days")
  @commandOption("--output <path>", "Write the generated HTML report to this path")
  async report(this: RootCommand, @requiredArg("action") action: string) {
    await runHandled(async () => {
      if (action !== "generate") {
        fail("Unsupported report action.", { action });
      }

      const options = this as RootCommand & {
        days?: string;
        output?: string;
      };
      const root = getRootOptions(this);
      const days = parseOptionalInt(options.days, "days") ?? 30;
      const client = new InstasightsApiClient(root.appUrl);

      printJson(
        await runWithRuntimeLogging(`Generating the ${days}-day HTML report`, async () =>
          generateHtmlReport({
            client,
            days,
            outputPath: options.output,
          }),
        ),
      );
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
        logRuntime("Opening the Instagram linking handoff in the browser.");
        await openBrowser(instagramLinkUrl);
      } else {
        logRuntime("Browser launch is disabled; printing the Instagram linking URL instead.");
      }

      printJson({
        instagramLinkUrl,
        openedInBrowser: shouldOpen,
      });
    });
  }

  @command()
  @commandOption("--apply", "Apply the update immediately after checking")
  @commandOption("--force", "Reinstall the published version even when versions match")
  async update(this: RootCommand, @requiredArg("action") action: string) {
    await runHandled(async () => {
      const root = getRootOptions(this);
      const options = this as RootCommand & {
        apply?: boolean;
        force?: boolean;
      };
      const force = options.force === true;
      const shouldApply = action === "apply" || options.apply === true;
      const result = await runWithRuntimeLogging(
        "Checking for CLI updates",
        async () =>
          checkForUpdates({
            allowCache: false,
            force,
          }),
      );

      if (action !== "check" && action !== "apply") {
        fail("Unsupported update action.", { action });
      }

      if (!shouldApply) {
        printJson(result);
        return;
      }

      const applyResult = await runWithRuntimeLogging("Applying the CLI update", async () =>
        applyUpdate(result, {
          force,
        }),
      );

      printJson({
        ...result,
        apply: applyResult,
      });
    });
  }
}

export function runCli() {
  new InstasightsCli();
}
