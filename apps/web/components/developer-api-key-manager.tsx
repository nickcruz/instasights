"use client";

import { useState } from "react";
import type { DeveloperApiKeySummary } from "@instagram-insights/contracts";
import posthog from "posthog-js";

import { Button } from "@/components/ui/button";
import { CopySnippet } from "@/components/copy-snippet";

type DeveloperApiKeyManagerProps = {
  initialKeys: DeveloperApiKeySummary[];
  canCreateKeys: boolean;
};

type CreateKeyPayload = {
  apiKey: string;
  key: DeveloperApiKeySummary | null;
};

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Never";
  }

  return new Date(value).toLocaleString();
}

export function DeveloperApiKeyManager({
  initialKeys,
  canCreateKeys,
}: DeveloperApiKeyManagerProps) {
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("Codex access");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/developer/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const payload = (await response.json()) as
        | CreateKeyPayload
        | { error?: string };

      if (!response.ok || !("apiKey" in payload)) {
        throw new Error(
          "error" in payload
            ? payload.error ?? "Unable to create API key."
            : "Unable to create API key.",
        );
      }

      setRevealedKey(payload.apiKey);

      if (payload.key) {
        setKeys((current) => [payload.key!, ...current]);
      }

      posthog.capture("developer_api_key_created", { key_name: name });
      setName("Codex access");
    } catch (cause) {
      posthog.captureException(cause);
      setError(
        cause instanceof Error ? cause.message : "Unable to create API key.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRevoke(keyId: string) {
    setError(null);
    setRevokingKeyId(keyId);

    try {
      const response = await fetch(`/api/developer/keys/${keyId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as
        | { keyId: string; revokedAt: string | null }
        | { error?: string };

      if (!response.ok || !("keyId" in payload)) {
        throw new Error(
          "error" in payload
            ? payload.error ?? "Unable to revoke API key."
            : "Unable to revoke API key.",
        );
      }

      setKeys((current) =>
        current.map((key) =>
          key.id === payload.keyId
            ? {
                ...key,
                revokedAt: payload.revokedAt,
              }
            : key,
        ),
      );
      posthog.capture("developer_api_key_revoked", { key_id: keyId });
    } catch (cause) {
      posthog.captureException(cause);
      setError(
        cause instanceof Error ? cause.message : "Unable to revoke API key.",
      );
    } finally {
      setRevokingKeyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-6 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Personal API Keys
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
              Keys are scoped to your signed-in app account and only read your
              already-ingested Instagram analytics data.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[320px]">
            <input
              className="rounded-2xl border border-[var(--border)] bg-[var(--popover)] px-4 py-3 text-sm text-[var(--foreground)] outline-none ring-0"
              disabled={!canCreateKeys || isCreating}
              onChange={(event) => setName(event.target.value)}
              placeholder="Key name"
              value={name}
            />
            <Button
              disabled={!canCreateKeys || isCreating}
              onClick={handleCreate}
            >
              {isCreating ? "Creating key..." : "Create API key"}
            </Button>
          </div>
        </div>

        {!canCreateKeys ? (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            Link Instagram first so the resulting key has data to read.
          </p>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-4 text-sm text-[var(--foreground)]">
            {error}
          </div>
        ) : null}
      </div>

      {revealedKey ? (
        <CopySnippet
          title="New Key"
          description="This secret is only shown once. Save it in your shell as INSTAGRAM_INSIGHTS_API_KEY before installing the MCP."
          value={revealedKey}
        />
      ) : null}

      <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-6 backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          Existing Keys
        </p>
        <div className="mt-4 space-y-3">
          {keys.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--popover)] p-4 text-sm text-[var(--muted-foreground)]">
              No personal API keys created yet.
            </div>
          ) : (
            keys.map((key) => (
              <div
                key={key.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-[var(--foreground)]">
                      {key.name}
                    </p>
                    <p className="font-mono text-sm text-[var(--foreground)]">
                      {key.keyPrefix}
                    </p>
                    <div className="grid gap-1 text-sm text-[var(--muted-foreground)] md:grid-cols-2 md:gap-x-6">
                      <p>Created {formatTimestamp(key.createdAt)}</p>
                      <p>Last used {formatTimestamp(key.lastUsedAt)}</p>
                      <p>
                        Status{" "}
                        {key.revokedAt
                          ? `revoked ${formatTimestamp(key.revokedAt)}`
                          : "active"}
                      </p>
                    </div>
                  </div>
                  <Button
                    disabled={Boolean(key.revokedAt) || revokingKeyId === key.id}
                    onClick={() => handleRevoke(key.id)}
                    variant="outline"
                  >
                    {revokingKeyId === key.id ? "Revoking..." : "Revoke"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
