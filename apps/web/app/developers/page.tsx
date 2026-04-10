import {
  getAccountOverviewByUserId,
  isDatabaseConfigured,
  listDeveloperApiKeySummariesByUserId,
} from "@instagram-insights/db";
import { ArrowRight, KeyRound, LinkIcon, Terminal } from "lucide-react";
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
    "/plugin marketplace add https://github.com/kingscrosslabs/marketplace.git";
  const pluginInstall = "/plugin install instagram-insights@kingscrosslabs-marketplace";
  const authLogin = "./skills/instagram-insights/instagram-insights auth login";
  const setupStatus = "./skills/instagram-insights/instagram-insights setup status";
  const syncWait = "./skills/instagram-insights/instagram-insights sync run --wait";
  const linkInstagram =
    "./skills/instagram-insights/instagram-insights instagram link --open";
  const apiKeySmokeTest = `curl -H "Authorization: Bearer $INSTAGRAM_INSIGHTS_API_KEY" \\\n  ${appUrl}/api/v1/account`;

  return (
    <main className="min-h-screen bg-white px-6 py-10 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-6">
        <Card className="overflow-hidden bg-white/80 backdrop-blur">
          <CardContent className="grid gap-8 p-8 md:grid-cols-[1.1fr_0.9fr] md:p-10">
            <div className="space-y-5">
              <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--secondary)] px-4 py-1.5 text-sm text-[var(--secondary-foreground)]">
                Skill support and troubleshooting
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                  Instagram Insights
                </p>
                <h1 className="mt-3 max-w-3xl font-heading text-5xl leading-none md:text-7xl">
                  Authenticate the skill, link Instagram, and inspect the hosted API from one CLI.
                </h1>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
                The supported workflow is now one installable skill with a
                bundled CLI. The browser still completes Google sign-in and the
                Instagram linking handoff, but data access runs through the
                hosted REST API instead of MCP.
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
              You were redirected from the deprecated `{params.legacy}` path.
              This page now documents the skill-and-CLI workflow and keeps the
              legacy API-key tools available for compatibility.
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <CopySnippet
            title="Claude Marketplace"
            description="Add the GitHub repo as a Claude marketplace."
            value={pluginMarketplace}
          />
          <CopySnippet
            title="Skill Install"
            description="Install the Instagram Insights skill package from the marketplace."
            value={pluginInstall}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <CopySnippet
            title="CLI Auth Login"
            description="Start the hosted OAuth flow and finish Google sign-in in the browser."
            value={authLogin}
          />
          <CopySnippet
            title="Setup Status"
            description="Check whether auth, Instagram linking, and sync freshness are ready."
            value={setupStatus}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <CopySnippet
            title="Sync And Wait"
            description="Queue a sync if needed and poll until it reaches a terminal state."
            value={syncWait}
          />
          <CopySnippet
            title="Link Instagram"
            description="Open the hosted Instagram OAuth handoff from the CLI."
            value={linkInstagram}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Card className="bg-white/75 backdrop-blur">
            <CardHeader>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <Terminal className="size-5" />
              </div>
              <CardTitle>Bundled CLI</CardTitle>
              <CardDescription>
                The supported interface is now the skill-local macOS
                `instagram-insights` CLI bundled with the installable skill.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/75 backdrop-blur">
            <CardHeader>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <LinkIcon className="size-5" />
              </div>
              <CardTitle>Browser handoffs</CardTitle>
              <CardDescription>
                Google sign-in and Instagram linking still happen here in the
                browser, then the CLI resumes locally with stored tokens.
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
                Personal API keys remain available for compatibility scripts,
                but they are no longer the primary product path.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Recommended Flow</CardTitle>
            <CardDescription>
              The skill should drive the CLI in this order.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {[
              "1. Install the Instagram Insights skill from the marketplace.",
              "2. Run `auth login` and finish Google sign-in in the browser.",
              "3. Run `setup status` to inspect readiness.",
              "4. If needed, run `instagram link --open` and finish the Meta handoff.",
              "5. Run `sync run --wait` when the account is not synced or stale.",
              "6. Use `account overview`, `snapshot latest`, and `media` commands for analysis.",
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

        <CopySnippet
          title="Legacy API Key Smoke Test"
          description="Direct REST validation for the compatibility API-key path."
          value={apiKeySmokeTest}
        />

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
