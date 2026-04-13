import assert from "node:assert/strict";
import test from "node:test";

import type { SyncRunDetailResponse } from "./types";
import {
  formatDurationEstimate,
  logSyncRunQueued,
  resolveWaitableSyncRunId,
  waitForSyncRun,
} from "./sync-logging";

function captureStderr() {
  const stderr: string[] = [];
  const originalError = console.error;

  console.error = (...args: unknown[]) => {
    stderr.push(args.map(String).join(" "));
  };

  return {
    stderr,
    restore() {
      console.error = originalError;
    },
  };
}

function buildDetail(input: {
  status: string;
  currentStep?: string | null;
  progressPercent?: number | null;
  statusMessage?: string | null;
  durationSeconds?: number | null;
  progress?: NonNullable<SyncRunDetailResponse["syncRun"]>["progress"];
  error?: string | null;
}): SyncRunDetailResponse {
  return {
    syncRun: {
      id: "sync_123",
      instagramAccountId: "acct_123",
      status: input.status,
      triggerType: "manual",
      workflowRunId: "wf_123",
      currentStep: input.currentStep ?? null,
      progressPercent: input.progressPercent ?? null,
      statusMessage: input.statusMessage ?? null,
      startedAt: new Date("2026-04-13T12:00:00.000Z").toISOString(),
      completedAt: input.status === "completed" ? new Date("2026-04-13T12:02:00.000Z").toISOString() : null,
      lastHeartbeatAt: new Date("2026-04-13T12:01:00.000Z").toISOString(),
      durationSeconds: input.durationSeconds ?? null,
      mediaCount: 10,
      warningCount: 0,
      error: input.error ?? null,
      progress: input.progress ?? null,
      summary: null,
      createdAt: new Date("2026-04-13T12:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-04-13T12:01:00.000Z").toISOString(),
      report: null,
    },
  };
}

test("formatDurationEstimate prefers recent historical duration when present", () => {
  assert.match(formatDurationEstimate(185), /about 3m/);
  assert.match(formatDurationEstimate(null), /roughly 1-5 minutes/);
});

test("waitForSyncRun logs meaningful sync progress changes and heartbeats", async () => {
  const capture = captureStderr();
  const originalNow = Date.now;
  let now = 0;
  const polledStatuses: string[] = [];
  Date.now = () => {
    now += 2;
    return now;
  };

  const responses = [
    buildDetail({
      status: "queued",
      currentStep: "queued",
      progressPercent: 0,
      statusMessage: "Sync queued",
    }),
    buildDetail({
      status: "running",
      currentStep: "media-catalog",
      progressPercent: 32,
      statusMessage: "Fetching media catalog",
    }),
    buildDetail({
      status: "running",
      currentStep: "media-catalog",
      progressPercent: 32,
      statusMessage: "Fetching media catalog",
    }),
    buildDetail({
      status: "completed",
      currentStep: "finalize-analysis",
      progressPercent: 100,
      statusMessage: "Sync completed",
      durationSeconds: 120,
    }),
  ];

  try {
    const finalDetail = await waitForSyncRun({
      client: {
        async getSyncRun() {
          return responses.shift() ?? responses[responses.length - 1]!;
        },
      },
      syncRunId: "sync_123",
      pollIntervalMs: 0,
      heartbeatIntervalMs: 1,
      onPoll: async (detail) => {
        polledStatuses.push(detail.syncRun?.status ?? "missing");
      },
      sleep: async () => undefined,
    });

    assert.equal(finalDetail.syncRun?.status, "completed");
  } finally {
    Date.now = originalNow;
    capture.restore();
  }

  assert.equal(capture.stderr.length, 4);
  assert.deepEqual(polledStatuses, ["queued", "running", "running", "completed"]);
  assert.equal(JSON.parse(capture.stderr[0]).event, "runtime_log");
  assert.match(JSON.parse(capture.stderr[0]).message, /is queued during queueing/);
  assert.match(JSON.parse(capture.stderr[1]).message, /fetching media catalog/);
  assert.match(JSON.parse(capture.stderr[2]).message, /Still waiting on sync sync_123/);
  assert.match(JSON.parse(capture.stderr[3]).message, /is completed during finalizing analysis/);
});

test("logSyncRunQueued emits JSON log lines", () => {
  const capture = captureStderr();

  try {
    logSyncRunQueued({
      queuedNewRun: true,
      reusedExistingRun: false,
      syncRunId: "sync_999",
      syncRun: buildDetail({
        status: "queued",
        currentStep: "queued",
        progressPercent: 0,
        statusMessage: "Sync queued",
        durationSeconds: 90,
      }).syncRun,
    });
  } finally {
    capture.restore();
  }

  assert.equal(capture.stderr.length, 2);
  assert.deepEqual(JSON.parse(capture.stderr[0]), {
    event: "runtime_log",
    message: "Queued Instagram sync sync_999.",
  });
  assert.equal(JSON.parse(capture.stderr[1]).event, "runtime_log");
  assert.match(JSON.parse(capture.stderr[1]).message, /about 1m 30s/);
});

test("resolveWaitableSyncRunId attaches to queued or running existing runs", () => {
  assert.equal(
    resolveWaitableSyncRunId({
      queuedNewRun: false,
      reusedExistingRun: true,
      reason: "A sync is already in progress.",
      syncRun: buildDetail({
        status: "running",
        currentStep: "media-catalog",
        progressPercent: 32,
      }).syncRun!,
    }),
    "sync_123",
  );

  assert.equal(
    resolveWaitableSyncRunId({
      queuedNewRun: false,
      reusedExistingRun: false,
      reason: "Data is already fresh.",
      syncRun: buildDetail({
        status: "completed",
        currentStep: "complete",
        progressPercent: 100,
      }).syncRun!,
    }),
    null,
  );
});
