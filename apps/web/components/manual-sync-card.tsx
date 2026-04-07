"use client";

import { useState } from "react";

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

type SyncResponse = {
  summary: SyncSummary;
  report: {
    warnings: string[];
  };
};

type ManualSyncCardProps = {
  enabled: boolean;
  latestSyncRun: {
    status: string;
    startedAt: string;
    completedAt: string | null;
    mediaCount: number | null;
    warningCount: number | null;
  } | null;
};

export function ManualSyncCard({
  enabled,
  latestSyncRun,
}: ManualSyncCardProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SyncResponse | null>(null);

  async function handleSync() {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch("/api/instagram/sync", {
        method: "POST",
      });

      const payload = (await response.json()) as
        | SyncResponse
        | { error?: string };

      if (!response.ok || !("summary" in payload)) {
        const errorMessage =
          "error" in payload ? payload.error : "Instagram sync failed.";
        throw new Error(errorMessage ?? "Instagram sync failed.");
      }

      setResult(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Instagram sync failed.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <Card className="bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle>Manual Instagram sync</CardTitle>
        <CardDescription>
          Run the TypeScript full-sync flow on demand using the linked Instagram
          access token.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Button disabled={!enabled || isRunning} onClick={handleSync}>
          {isRunning ? "Running full sync..." : "Run full sync now"}
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

        {result ? (
          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Account
                </p>
                <p className="mt-1 text-sm font-semibold">
                  @{result.summary.username}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Media
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {result.summary.mediaCount}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Warnings
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {result.summary.warningCount}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Duration
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {result.summary.durationSeconds}s
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                Top media IDs
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.summary.topMediaIds.slice(0, 5).map((mediaId, index) => (
                  <span
                    className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium"
                    key={mediaId ?? `unknown-${index}`}
                  >
                    {mediaId ?? "unknown"}
                  </span>
                ))}
              </div>
            </div>

            {result.report.warnings.length ? (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Latest warnings
                </p>
                <ul className="mt-2 space-y-2 text-sm text-[var(--foreground)]">
                  {result.report.warnings.slice(0, 5).map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : latestSyncRun ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-4 text-sm text-[var(--foreground)]">
            Last stored sync: {latestSyncRun.status} at{" "}
            {new Date(latestSyncRun.startedAt).toLocaleString()}
            {typeof latestSyncRun.mediaCount === "number"
              ? `, ${latestSyncRun.mediaCount} media`
              : ""}
            {typeof latestSyncRun.warningCount === "number"
              ? `, ${latestSyncRun.warningCount} warnings`
              : ""}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
