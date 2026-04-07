"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SyncSummary = {
  username: string;
  mediaCount: number;
  warningCount: number;
  topMediaIds: Array<string | null | undefined>;
  durationSeconds: number;
};

type SyncRunStatus = {
  syncRunId: string;
  workflowRunId: string | null;
  triggerType: string | null;
  status: string;
  currentStep: string | null;
  progressPercent: number | null;
  statusMessage: string | null;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
  lastHeartbeatAt: string | null;
  mediaCount: number | null;
  warningCount: number | null;
  summary: SyncSummary | null;
};

type ManualSyncCardProps = {
  enabled: boolean;
  latestSyncRun: SyncRunStatus | null;
};

type QueueResponse = {
  syncRunId: string;
  workflowRunId: string;
  status: string;
};

async function loadSyncRun(syncRunId: string) {
  const response = await fetch(`/api/instagram/sync/${syncRunId}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json()) as SyncRunStatus | { error?: string };

  if (!response.ok || !("syncRunId" in payload)) {
    const errorMessage =
      "error" in payload ? payload.error : "Unable to load sync status.";
    throw new Error(errorMessage ?? "Unable to load sync status.");
  }

  return payload;
}

export function ManualSyncCard({
  enabled,
  latestSyncRun,
}: ManualSyncCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncRun, setSyncRun] = useState<SyncRunStatus | null>(latestSyncRun);

  useEffect(() => {
    setSyncRun(latestSyncRun);
  }, [latestSyncRun]);

  useEffect(() => {
    if (!syncRun || !["queued", "running"].includes(syncRun.status)) {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const nextRun = await loadSyncRun(syncRun.syncRunId);
        setSyncRun(nextRun);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Unable to refresh sync status.",
        );
      }
    }, 4000);

    return () => window.clearInterval(interval);
  }, [syncRun]);

  async function handleSync() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/instagram/sync", {
        method: "POST",
      });

      const payload = (await response.json()) as QueueResponse | { error?: string };

      if (!response.ok || !("syncRunId" in payload)) {
        const errorMessage =
          "error" in payload ? payload.error : "Instagram sync failed.";
        throw new Error(errorMessage ?? "Instagram sync failed.");
      }

      const nextRun = await loadSyncRun(payload.syncRunId);
      setSyncRun(nextRun);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Instagram sync failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isActive = syncRun ? ["queued", "running"].includes(syncRun.status) : false;
  const progressPercent = syncRun?.progressPercent ?? 0;

  return (
    <Card className="bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle>Manual Instagram sync</CardTitle>
        <CardDescription>
          Queue a durable workflow run that ingests Instagram data in the
          background using the linked access token.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Button disabled={!enabled || isSubmitting || isActive} onClick={handleSync}>
          {isSubmitting
            ? "Queueing sync..."
            : isActive
              ? "Sync in progress..."
              : "Run full sync now"}
        </Button>

        {!enabled ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Link an Instagram account first to enable manual ingestion.
          </p>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-4 text-sm text-[var(--foreground)]">
            {error}
          </div>
        ) : null}

        {syncRun ? (
          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Current run
                </p>
                <p className="mt-1 text-base font-semibold capitalize">
                  {syncRun.status.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {syncRun.statusMessage ?? "No status message yet."}
                </p>
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">
                Started {new Date(syncRun.startedAt).toLocaleString()}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                <span>{syncRun.currentStep ?? "queued"}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--secondary)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all"
                  style={{ width: `${Math.max(0, Math.min(progressPercent, 100))}%` }}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Media
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {syncRun.summary?.mediaCount ?? syncRun.mediaCount ?? "Pending"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Warnings
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {syncRun.summary?.warningCount ?? syncRun.warningCount ?? "Pending"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Completed
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {syncRun.completedAt
                    ? new Date(syncRun.completedAt).toLocaleString()
                    : "Not yet"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Workflow run
                </p>
                <p className="mt-1 truncate text-sm font-semibold">
                  {syncRun.workflowRunId ?? "Pending"}
                </p>
              </div>
            </div>

            {syncRun.summary ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                    Account
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    @{syncRun.summary.username}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                    Top media IDs
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {syncRun.summary.topMediaIds.slice(0, 5).map((mediaId, index) => (
                      <span
                        className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium"
                        key={mediaId ?? `unknown-${index}`}
                      >
                        {mediaId ?? "unknown"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {syncRun.error ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm text-[var(--foreground)]">
                {syncRun.error}
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
