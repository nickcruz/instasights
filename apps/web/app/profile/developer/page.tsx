import {
  getInstagramAccountByUserId,
  getLatestInstagramSyncRun,
  listDeveloperApiKeySummariesByUserId,
} from "@instagram-insights/db";
import { ArrowRight, Database, KeyRound, Puzzle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CopySnippet } from "@/components/copy-snippet";
import { DeveloperApiKeyManager } from "@/components/developer-api-key-manager";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAppUrl } from "@/lib/app-url";
import { auth } from "@/lib/auth";

function formatDateTime(value: Date | null | undefined) {
  return value ? value.toLocaleString() : "Not available";
}

export default async function DeveloperAccessPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const userId = session.user.id;
  const appUrl = await getAppUrl();
  const [instagramAccount, latestSyncRun, apiKeys] = await Promise.all([
    getInstagramAccountByUserId(userId),
    getLatestInstagramSyncRun(userId),
    listDeveloperApiKeySummariesByUserId(userId),
  ]);

  const codexInstall = `export INSTAGRAM_INSIGHTS_API_KEY="paste-your-key"\ncodex mcp add instagram-insights --url ${appUrl}/mcp --bearer-token-env-var INSTAGRAM_INSIGHTS_API_KEY`;
  const claudeInstall = `claude mcp add --transport http instagram-insights ${appUrl}/mcp`;
  const smokeTest = `curl -H "Authorization: Bearer $INSTAGRAM_INSIGHTS_API_KEY" \\\n  ${appUrl}/api/v1/account`;
  const triggerSync = `curl -X POST \\\n  -H "Authorization: Bearer $INSTAGRAM_INSIGHTS_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"force":false,"staleAfterHours":12}' \\\n  ${appUrl}/api/v1/sync-runs`;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(29,107,87,0.18),transparent_30%),linear-gradient(180deg,#f7efe2_0%,#f3eadc_35%,#efe4d6_100%)] px-6 py-10 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-6">
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="grid gap-8 p-8 md:grid-cols-[1.15fr_0.85fr] md:p-10">
            <div className="space-y-5">
              <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--secondary)] px-4 py-1.5 text-sm text-[var(--secondary-foreground)]">
                Signed-in developer access
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                  Hosted API + MCP
                </p>
                <h1 className="mt-3 max-w-3xl font-heading text-4xl leading-none md:text-6xl">
                  Create keys, install the MCP, and verify your Instagram data is ready.
                </h1>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
                Everything here is scoped to {session.user.email ?? "your app user"}.
                Keys only read data that has already been ingested for this
                account.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/developers">
                    Open public docs
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/profile">Back to profile</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(251,245,238,0.96),rgba(245,235,224,0.86))] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                Readiness checklist
              </p>
              <div className="mt-4 space-y-4 text-sm text-[var(--foreground)]">
                <div>
                  <p className="font-semibold">1. App session</p>
                  <p className="mt-1 text-[var(--muted-foreground)]">
                    Signed in as {session.user.email ?? "unknown"}.
                  </p>
                </div>
                <div>
                  <p className="font-semibold">2. Instagram link</p>
                  <p className="mt-1 text-[var(--muted-foreground)]">
                    {instagramAccount
                      ? `Linked @${instagramAccount.username ?? "unknown"}`
                      : "Not linked yet"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">3. Latest sync</p>
                  <p className="mt-1 text-[var(--muted-foreground)]">
                    {latestSyncRun
                      ? `${latestSyncRun.status} at ${formatDateTime(latestSyncRun.startedAt)}`
                      : "No sync run recorded yet"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 md:grid-cols-3">
          <Card className="bg-white/75 backdrop-blur">
            <CardHeader>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <Database className="size-5" />
              </div>
              <CardTitle>Linked account</CardTitle>
              <CardDescription>
                The hosted API and MCP read only the signed-in user&apos;s ingested
                Instagram rows.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-[var(--muted-foreground)]">
              <p>
                {instagramAccount
                  ? `@${instagramAccount.username ?? "unknown"} linked on ${formatDateTime(instagramAccount.linkedAt)}`
                  : "Link Instagram from the profile page before creating keys."}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/75 backdrop-blur">
            <CardHeader>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <Puzzle className="size-5" />
              </div>
              <CardTitle>MCP endpoint</CardTitle>
              <CardDescription>
                Hosted Streamable HTTP endpoint for Codex and Claude Code.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-[var(--muted-foreground)]">
              <p className="font-mono text-[var(--foreground)]">{appUrl}/mcp</p>
            </CardContent>
          </Card>

          <Card className="bg-white/75 backdrop-blur">
            <CardHeader>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <KeyRound className="size-5" />
              </div>
              <CardTitle>Existing keys</CardTitle>
              <CardDescription>
                Personal API keys can read data and queue workflow-backed syncs for this user.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-[var(--muted-foreground)]">
              <p>{apiKeys.length} key(s) created</p>
            </CardContent>
          </Card>
        </div>

        <DeveloperApiKeyManager
          canCreateKeys={Boolean(instagramAccount)}
          initialKeys={apiKeys}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <CopySnippet
            title="Codex Install"
            description="Run this after exporting the newly created personal key."
            value={codexInstall}
          />
          <CopySnippet
            title="Claude Code Install"
            description="Claude Code can use the hosted MCP's OAuth flow directly, so no personal API key is required for the MCP install."
            value={claudeInstall}
          />
        </div>

        <CopySnippet
          title="Smoke Test"
          description="Confirm the key can read your account overview through the REST API."
          value={smokeTest}
        />

        <CopySnippet
          title="Queue Sync"
          description="Use the REST API to queue a full sync when the latest data is stale."
          value={triggerSync}
        />
      </div>
    </main>
  );
}
