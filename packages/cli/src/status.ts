import type { SetupStatusResponse } from "@instasights/contracts";

import type { AccountOverviewResponse } from "./types";

function roundHours(hours: number) {
  return Number(hours.toFixed(1));
}

export function deriveSetupStatus(input: {
  overview: AccountOverviewResponse;
  appUrl: string;
  staleAfterHours: number;
}): SetupStatusResponse {
  const latestSyncRun = input.overview.latestSyncRun;
  const instagramLinkUrl = new URL("/api/login", input.appUrl).toString();
  const developersUrl = new URL("/developers", input.appUrl).toString();
  const latestCompletedAt = latestSyncRun?.completedAt ?? null;
  const ageHours = latestCompletedAt
    ? roundHours(
        (Date.now() - new Date(latestCompletedAt).getTime()) / (60 * 60 * 1000),
      )
    : null;
  const isActiveSync = Boolean(
    latestSyncRun && ["queued", "running"].includes(latestSyncRun.status),
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
        summary: "No Instagram account is linked yet.",
      },
      instagramLinkUrl,
      developersUrl,
      recommendedNextAction: "connect_instagram",
      recommendedPrompt:
        "Run `instasights instagram link --open` to connect Instagram, then rerun `setup status`.",
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
        summary: `A sync is currently ${latestSyncRun?.status ?? "running"}.`,
      },
      instagramLinkUrl,
      developersUrl,
      recommendedNextAction: "wait_for_sync",
      recommendedPrompt: latestSyncRun?.id
        ? `Run \`sync get ${latestSyncRun.id}\` or \`sync run --wait\`.`
        : "Check sync run status again before continuing.",
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
        summary: "No completed sync is available yet.",
      },
      instagramLinkUrl,
      developersUrl,
      recommendedNextAction: "trigger_sync",
      recommendedPrompt: `Run \`sync run --stale-after-hours ${input.staleAfterHours}\`.`,
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
        summary: `The latest completed sync is ${ageHours ?? "unknown"} hours old.`,
      },
      instagramLinkUrl,
      developersUrl,
      recommendedNextAction: "trigger_sync",
      recommendedPrompt: `Run \`sync run --stale-after-hours ${input.staleAfterHours}\`.`,
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
      summary: "The latest completed sync is fresh enough for analysis.",
    },
    instagramLinkUrl,
    developersUrl,
    recommendedNextAction: "analyze",
    recommendedPrompt:
      "Run `snapshot latest` for account analysis, then `media list` or `media get <id>` for drilldowns.",
  };
}
