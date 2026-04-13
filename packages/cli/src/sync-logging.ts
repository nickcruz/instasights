import type {
  InstagramSyncRunDetail,
  InstagramSyncRunSummary,
  SyncRunTriggerResponse,
  SyncRunDetailResponse,
} from "./types";

import { logRuntime } from "./output";

type PollableSyncRun = InstagramSyncRunSummary | InstagramSyncRunDetail;
type SyncPollClient = {
  getSyncRun(syncRunId: string): Promise<SyncRunDetailResponse>;
};

type SyncProgressSnapshot = {
  status: string | null;
  currentStep: string | null;
  progressPercent: number | null;
  statusMessage: string | null;
  completedBundles: number | null;
  totalBundles: number | null;
  activeBundleLabel: string | null;
  transcriptCompletedCount: number | null;
  transcriptFailedCount: number | null;
  transcriptEligibleCount: number | null;
  activeTranscriptMediaId: string | null;
  error: string | null;
};

const STEP_TO_PHASE: Record<string, string> = {
  queued: "queueing",
  bootstrap: "queueing",
  profile: "fetching profile/account data",
  "account-insights": "fetching profile/account data",
  "media-catalog": "fetching media catalog",
  "filter-recent-media": "processing media bundles",
  "fetch-media-detail-batch": "processing media bundles",
  "fetch-media-metrics-batch": "processing media bundles",
  "normalize-media-batch": "processing media bundles",
  comments: "fetching comments",
  persist: "persisting results",
  "transcribe-media": "transcribing video",
  "finalize-analysis": "finalizing analysis",
};

function formatCountProgress(completed: number | null, total: number | null) {
  if (
    typeof completed !== "number" ||
    !Number.isFinite(completed) ||
    typeof total !== "number" ||
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return null;
  }

  return `${completed}/${total}`;
}

export function getSyncPhase(currentStep: string | null | undefined) {
  if (!currentStep) {
    return "working";
  }

  return STEP_TO_PHASE[currentStep] ?? currentStep.replaceAll("-", " ");
}

export function formatDurationEstimate(seconds: number | null | undefined) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return "Expect roughly 1-5 minutes depending on account size and transcript backlog.";
  }

  const roundedSeconds = Math.max(30, Math.round(seconds / 30) * 30);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainderSeconds = roundedSeconds % 60;
  const formatted =
    minutes > 0 && remainderSeconds > 0
      ? `${minutes}m ${remainderSeconds}s`
      : minutes > 0
        ? `${minutes}m`
        : `${roundedSeconds}s`;

  return `A recent sync finished in about ${formatted}, so this run may take around that long.`;
}

export function buildSyncProgressSnapshot(
  syncRun: PollableSyncRun | null | undefined,
): SyncProgressSnapshot | null {
  if (!syncRun) {
    return null;
  }

  return {
    status: syncRun.status ?? null,
    currentStep: syncRun.currentStep ?? null,
    progressPercent: syncRun.progressPercent ?? null,
    statusMessage: syncRun.statusMessage ?? null,
    completedBundles: syncRun.progress?.completedBundles ?? null,
    totalBundles: syncRun.progress?.totalBundles ?? null,
    activeBundleLabel: syncRun.progress?.activeBundleLabel ?? null,
    transcriptCompletedCount: syncRun.progress?.transcriptCompletedCount ?? null,
    transcriptFailedCount: syncRun.progress?.transcriptFailedCount ?? null,
    transcriptEligibleCount: syncRun.progress?.transcriptEligibleCount ?? null,
    activeTranscriptMediaId: syncRun.progress?.activeTranscriptMediaId ?? null,
    error: syncRun.error ?? null,
  };
}

export function hasMeaningfulSyncProgressChange(
  left: SyncProgressSnapshot | null,
  right: SyncProgressSnapshot | null,
) {
  return JSON.stringify(left) !== JSON.stringify(right);
}

export function formatSyncProgressLine(syncRun: PollableSyncRun) {
  const phase = getSyncPhase(syncRun.currentStep);
  const parts = [
    `Sync ${syncRun.id} is ${syncRun.status} during ${phase}`,
  ];

  if (typeof syncRun.progressPercent === "number") {
    parts.push(`(${syncRun.progressPercent}%)`);
  }

  if (syncRun.statusMessage) {
    parts.push(`- ${syncRun.statusMessage}`);
  }

  const bundleProgress = formatCountProgress(
    syncRun.progress?.completedBundles ?? null,
    syncRun.progress?.totalBundles ?? null,
  );

  if (bundleProgress) {
    parts.push(`bundles ${bundleProgress}`);
  }

  const transcriptProgress = formatCountProgress(
    (syncRun.progress?.transcriptCompletedCount ?? 0) +
      (syncRun.progress?.transcriptFailedCount ?? 0),
    syncRun.progress?.transcriptEligibleCount ?? null,
  );

  if (transcriptProgress) {
    parts.push(`transcripts ${transcriptProgress}`);
  }

  if (syncRun.progress?.activeBundleLabel) {
    parts.push(`active bundle: ${syncRun.progress.activeBundleLabel}`);
  }

  if (syncRun.progress?.activeTranscriptMediaId) {
    parts.push(`active transcript: ${syncRun.progress.activeTranscriptMediaId}`);
  }

  return parts.join(" ");
}

export function logSyncRunQueued(input: {
  queuedNewRun: boolean;
  reusedExistingRun: boolean;
  syncRun: PollableSyncRun | null;
  syncRunId?: string;
  reason?: string;
}) {
  if (input.queuedNewRun) {
    logRuntime(
      `Queued Instagram sync ${input.syncRunId ?? input.syncRun?.id ?? "unknown"}.`,
    );
    logRuntime(formatDurationEstimate(input.syncRun?.durationSeconds ?? null));
    return;
  }

  if (input.reusedExistingRun && input.syncRun) {
    logRuntime(
      `Reusing active Instagram sync ${input.syncRun.id}; waiting for the existing run to finish.`,
    );
    logRuntime(formatDurationEstimate(input.syncRun.durationSeconds ?? null));
    return;
  }

  if (input.syncRun) {
    logRuntime(
      `No new sync was queued for ${input.syncRun.id}. ${input.reason ?? "Existing data is still fresh."}`,
    );
    if (input.syncRun.durationSeconds) {
      logRuntime(
        `Latest completed run duration: ${formatDurationEstimate(input.syncRun.durationSeconds)}`,
      );
    }
  }
}

export function resolveWaitableSyncRunId(result: SyncRunTriggerResponse) {
  if (result.queuedNewRun) {
    return result.syncRunId;
  }

  if (!("syncRun" in result) || !result.syncRun) {
    return null;
  }

  return ["queued", "running"].includes(result.syncRun.status) ? result.syncRun.id : null;
}

export async function waitForSyncRun(input: {
  client: SyncPollClient;
  syncRunId: string;
  pollIntervalMs?: number;
  heartbeatIntervalMs?: number;
  onPoll?: (detail: SyncRunDetailResponse) => void | Promise<void>;
  sleep?: (ms: number) => Promise<void>;
}) {
  const pollIntervalMs = input.pollIntervalMs ?? 1_000;
  const heartbeatIntervalMs = input.heartbeatIntervalMs ?? 10_000;
  const sleep =
    input.sleep ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  let previousSnapshot = null;
  let lastMeaningfulLogAt = Date.now();

  while (true) {
    const detail = await input.client.getSyncRun(input.syncRunId);
    const syncRun = detail.syncRun;
    const status = syncRun?.status;

    await input.onPoll?.(detail);

    if (syncRun) {
      const nextSnapshot = buildSyncProgressSnapshot(syncRun);

      if (hasMeaningfulSyncProgressChange(previousSnapshot, nextSnapshot)) {
        logRuntime(formatSyncProgressLine(syncRun));
        previousSnapshot = nextSnapshot;
        lastMeaningfulLogAt = Date.now();
      } else if (Date.now() - lastMeaningfulLogAt >= heartbeatIntervalMs) {
        logRuntime(
          `Still waiting on sync ${syncRun.id}; last known phase is ${syncRun.currentStep ?? "queued"} (${syncRun.progressPercent ?? 0}%).`,
        );
        lastMeaningfulLogAt = Date.now();
      }
    }

    if (!status || !["queued", "running"].includes(status)) {
      return detail;
    }

    await sleep(pollIntervalMs);
  }
}
