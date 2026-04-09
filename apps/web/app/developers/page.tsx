import {
  getAccountOverviewByUserId,
  isDatabaseConfigured,
  listDeveloperApiKeySummariesByUserId,
} from "@instagram-insights/db";
import { ArrowRight, KeyRound, LinkIcon, PlugZap } from "lucide-react";
import Link from "next/link";

import { AuthControls } from "@/components/auth-controls";
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
import { auth, isGoogleAuthConfigured } from "@/lib/auth";
import { isInstagramConfigured } from "@/lib/instagram-oauth";

type DevelopersPageProps = {
  searchParams: Promise<{
    legacy?: string;
  }>;
};

function formatDateTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "Not available";
}

export default async function DevelopersPage({
  searchParams,
}: DevelopersPageProps) {
  const params = await searchParams;
  const session = await auth();
  const appUrl = await getAppUrl();
  const overview =
    session?.user?.id && isDatabaseConfigured
      ? await getAccountOverviewByUserId(session.user.id)
      : null;
  const apiKeys =
    session?.user?.id && isDatabaseConfigured
      ? await listDeveloperApiKeySummariesByUserId(session.user.id)
      : [];

  const pluginMarketplace =
    "/plugin marketplace add https://github.com/nickcruz/instagram-insights.git";
  const pluginInstall = "/plugin install instagram-insights@instagram-insights-plugins";
  const localPlugin = "claude --plugin-dir ./plugins/instagram-insights";
  const pluginAppUrlEnv = `export INSTAGRAM_INSIGHTS_APP_URL="${appUrl}"`;
  const oauthFallback = `claude mcp add --transport http instagram-insights ${appUrl}/mcp`;
  const apiKeySmokeTest = `curl -H "Authorization: Bearer $INSTAGRAM_INSIGHTS_API_KEY" \\\n  ${appUrl}/api/v1/account`;

  return (
    <main className="min-h-screen bg-white px-6 py-10 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-6">
        <Card className="overflow-hidden bg-white/80 backdrop-blur">
          <CardContent className="grid gap-8 p-8 md:grid-cols-[1.1fr_0.9fr] md:p-10">
            <div className="space-y-5">
              <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--secondary)] px-4 py-1.5 text-sm text-[var(--secondary-foreground)]">
                Claude plugin first
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                  Instagram Insights
                </p>
                <h1 className="mt-3 max-w-3xl font-heading text-5xl leading-none md:text-7xl">
                  Install the Claude plugin, authenticate once, and let Claude run the workflow.
                </h1>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
                The hosted app is now the backend and auth handoff layer for the
                Claude plugin. The primary flow is Claude plugin install,
                Claude-managed MCP OAuth, Instagram linking, and LLM-driven sync
                orchestration.
              </p>
              <div className="flex flex-wrap gap-3">
                <AuthControls
                  isAuthenticated={Boolean(session)}
                  googleAvailable={isGoogleAuthConfigured}
                />
                <Button asChild variant="outline">
                  <Link href="/api/login">
                    Link Instagram
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(251,245,238,0.96),rgba(245,235,224,0.86))] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                Readiness
              </p>
              <div className="mt-4 space-y-4 text-sm text-[var(--foreground)]">
                <div>
                  <p className="font-semibold">Google session</p>
                  <p className="mt-1 text-[var(--muted-foreground)]">
                    {session
                      ? `Signed in as ${session.user?.email ?? "user"}`
                      : isGoogleAuthConfigured
                        ? "Not signed in yet"
                        : "Google OAuth is not configured"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Instagram link</p>
                  <p className="mt-1 text-[var(--muted-foreground)]">
                    {overview?.account
                      ? `Linked @${overview.account.username ?? "unknown"}`
                      : isInstagramConfigured() && isDatabaseConfigured
                        ? "Not linked yet"
                        : "Instagram OAuth or database configuration is incomplete"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Latest sync</p>
                  <p className="mt-1 text-[var(--muted-foreground)]">
                    {overview?.latestSyncRun
                      ? `${overview.latestSyncRun.status} at ${formatDateTime(overview.latestSyncRun.completedAt ?? overview.latestSyncRun.startedAt)}`
                      : "No sync run recorded yet"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {params.legacy ? (
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-6 text-sm text-[var(--muted-foreground)]">
              You were redirected from the deprecated `{params.legacy}` dashboard path.
              Claude plugin install, troubleshooting, and the legacy API-key flow
              now live on this page.
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <CopySnippet
            title="Claude Marketplace"
            description="Add the GitHub repo as a Claude plugin marketplace."
            value={pluginMarketplace}
          />
          <CopySnippet
            title="Plugin Install"
            description="Install the Instagram Insights plugin from the marketplace."
            value={pluginInstall}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <CopySnippet
            title="Plugin App URL"
            description="Set this for local testing or self-hosting so the bundled MCP config resolves to the hosted app."
            value={pluginAppUrlEnv}
          />
          <CopySnippet
            title="Local Plugin Dev"
            description="Load the plugin directly from the local repo while iterating."
            value={localPlugin}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Card className="bg-white/75 backdrop-blur">
            <CardHeader>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <PlugZap className="size-5" />
              </div>
              <CardTitle>Claude OAuth</CardTitle>
              <CardDescription>
                Claude owns the MCP OAuth token and stores it locally after the
                browser sign-in flow.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/75 backdrop-blur">
            <CardHeader>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <LinkIcon className="size-5" />
              </div>
              <CardTitle>Instagram handoff</CardTitle>
              <CardDescription>
                After Claude auth is done, the connect flow uses the same browser
                session at {appUrl}.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/75 backdrop-blur">
            <CardHeader>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <KeyRound className="size-5" />
              </div>
              <CardTitle>Legacy API keys</CardTitle>
              <CardDescription>
                API keys are still supported for fallback REST access, but they
                are no longer the primary install path.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Plugin Workflow</CardTitle>
            <CardDescription>
              The intended user journey is now plugin-first and LLM-orchestrated.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {[
              "1. Add the GitHub repo as a Claude marketplace.",
              "2. Install instagram-insights@instagram-insights-plugins.",
              "3. Let Claude authenticate the hosted MCP through browser OAuth.",
              "4. Run /instagram-insights:setup.",
              "5. If prompted, open the Instagram link handoff and finish the Meta OAuth flow.",
              "6. Let Claude trigger or poll sync runs as needed.",
            ].map((step) => (
              <div
                key={step}
                className="rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-4 text-sm text-[var(--foreground)]"
              >
                {step}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <CopySnippet
            title="MCP Fallback"
            description="Manual remote MCP install if you need to debug outside the plugin flow."
            value={oauthFallback}
          />
          <CopySnippet
            title="Legacy API Key Smoke Test"
            description="Direct REST validation for the fallback API-key path."
            value={apiKeySmokeTest}
          />
        </div>

        {session ? (
          <DeveloperApiKeyManager
            canCreateKeys={Boolean(overview?.account)}
            initialKeys={apiKeys}
          />
        ) : null}
      </div>
    </main>
  );
}
