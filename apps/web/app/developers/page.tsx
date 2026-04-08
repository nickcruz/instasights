import { ArrowRight, Database, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { CopySnippet } from "@/components/copy-snippet";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAppUrl } from "@/lib/app-url";

const flowSteps = [
  "Sign in to the app with Google.",
  "Link your Instagram professional account.",
  "Run a full sync so the database has data for your user.",
  "Create a personal API key in the Developer Access screen if you want REST or non-OAuth MCP access.",
  "Install the hosted MCP in Codex or Claude Code.",
  "Verify with a quick `curl` request or an MCP tool call.",
];

const endpointRows = [
  ["GET", "/api/v1/account", "Account summary and latest sync metadata."],
  ["GET", "/api/v1/snapshot/latest", "Latest normalized account snapshot."],
  ["GET", "/api/v1/media", "Cursor-paginated media list with filters."],
  ["GET", "/api/v1/media/:mediaId", "Full detail for one media item."],
  ["GET", "/api/v1/sync-runs", "Cursor-paginated sync run history."],
  ["GET", "/api/v1/sync-runs/:syncRunId", "Detailed sync run payload."],
  ["POST", "/api/v1/sync-runs", "Queue a workflow-backed full sync, with stale-check or force options."],
  ["GET", "/api/v1/schema/tables", "Curated table documentation."],
];

const promptExamples = [
  "Use get_account_overview and tell me whether my latest sync looks healthy.",
  "If the latest completed sync is older than 12 hours, call trigger_sync and poll get_sync_run until it completes.",
  "Read schema://table/instagram_media_item and then list my latest REELS posts from the last 30 days.",
  "Compare my two most recent completed sync runs and summarize any changes in reach or warnings.",
];

const deployChecklist = [
  "Set production env vars for database, Google auth, and Instagram OAuth.",
  "Apply the Drizzle migration that creates developer_api_key.",
  "Set APP_URL so the docs page renders the correct public install snippets.",
  "Create a real user key from /profile/developer on production.",
  "Verify /api/v1/account with curl before debugging MCP clients.",
  "Install the hosted MCP in both Codex and Claude Code against the deployed domain.",
];

export default async function DevelopersPage() {
  const appUrl = await getAppUrl();
  const codexInstall = `export INSTAGRAM_INSIGHTS_API_KEY="paste-your-key"\ncodex mcp add instagram-insights --url ${appUrl}/mcp --bearer-token-env-var INSTAGRAM_INSIGHTS_API_KEY`;
  const claudeInstall = `claude mcp add --transport http instagram-insights ${appUrl}/mcp`;
  const smokeTest = `curl -H "Authorization: Bearer $INSTAGRAM_INSIGHTS_API_KEY" \\\n  ${appUrl}/api/v1/account`;
  const triggerSync = `curl -X POST \\\n  -H "Authorization: Bearer $INSTAGRAM_INSIGHTS_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"force":false,"staleAfterHours":12}' \\\n  ${appUrl}/api/v1/sync-runs`;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(29,107,87,0.18),transparent_30%),linear-gradient(180deg,#f7efe2_0%,#f3eadc_35%,#efe4d6_100%)] px-6 py-10 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-6">
        <Card className="overflow-hidden bg-white/80 backdrop-blur">
          <CardContent className="grid gap-8 p-8 md:grid-cols-[1.2fr_0.8fr] md:p-10">
            <div className="space-y-5">
              <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--secondary)] px-4 py-1.5 text-sm text-[var(--secondary-foreground)]">
                Hosted API + MCP
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                  Developer Access
                </p>
                <h1 className="mt-3 max-w-3xl font-heading text-5xl leading-none md:text-7xl">
                  Query your ingested Instagram data from Codex, Claude Code, or plain HTTP.
                </h1>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
                The web app now exposes a user-scoped, read-only developer surface:
                personal API keys, a hosted MCP server, curated schema resources, and
                REST endpoints for the data that has already been ingested into Postgres.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/profile/developer">
                    Open Developer Access
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/profile">Open profile</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(251,245,238,0.96),rgba(245,235,224,0.86))] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                What agents can do
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
                <p>1. Read `schema://overview` and `schema://table/*` resources.</p>
                <p>2. Fetch account overview, latest snapshot, media, and sync runs.</p>
                <p>3. Stay read-only and scoped to the API key owner.</p>
                <p>4. Avoid raw SQL or cross-user data access in v1.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 md:grid-cols-4">
          {[
            {
              icon: KeyRound,
              title: "Personal keys",
              body: "Create a key in the dashboard. The secret is shown once and only a hash is stored.",
            },
            {
              icon: Sparkles,
              title: "Hosted MCP",
              body: "Install one remote server URL instead of running a local adapter or direct SQL bridge.",
            },
            {
              icon: Database,
              title: "Curated tables",
              body: "Agents can read table docs for account, sync run, snapshot, and media records.",
            },
            {
              icon: ShieldCheck,
              title: "Read-only scope",
              body: "The API and MCP only expose already-ingested data for the key owner.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <Card key={title} className="bg-white/75 backdrop-blur">
              <CardHeader>
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Onboarding Flow</CardTitle>
            <CardDescription>
              Use this exact path when setting up a new user for the hosted API
              and MCP server.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {flowSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-4 text-sm text-[var(--foreground)]"
              >
                <span className="font-semibold">{index + 1}.</span> {step}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Deploy Checklist</CardTitle>
            <CardDescription>
              The code is in place, but production still needs a few operational
              steps before the hosted MCP is fully live.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {deployChecklist.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-4 text-sm text-[var(--foreground)]"
              >
                <span className="font-semibold">{index + 1}.</span> {step}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <CopySnippet
            title="Codex Install"
            description="Paste this in a shell after creating `INSTAGRAM_INSIGHTS_API_KEY`."
            value={codexInstall}
          />
          <CopySnippet
            title="Claude Code Install"
            description="Claude Code can use the hosted MCP's OAuth flow directly. It will open the browser, let the user sign in, and exchange an OAuth token automatically."
            value={claudeInstall}
          />
        </div>

        <CopySnippet
          title="Smoke Test"
          description="Verify that your key can read the authenticated account overview through the hosted REST API."
          value={smokeTest}
        />

        <CopySnippet
          title="Queue Sync"
          description="Queue a workflow-backed full sync through the hosted REST API when the latest data is stale."
          value={triggerSync}
        />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
              <CardTitle>REST Surface</CardTitle>
              <CardDescription>
                Every endpoint is authenticated with{" "}
                <code>Authorization: Bearer &lt;key&gt;</code> and returns only
                the current user&apos;s ingested data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {endpointRows.map(([method, path, description]) => (
                <div
                  key={path}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-4"
                >
                  <p className="font-mono text-sm text-[var(--foreground)]">
                    <span className="font-semibold">{method}</span> {path}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Prompt Starters</CardTitle>
              <CardDescription>
                These work well once the hosted MCP is installed in your agent
                client.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {promptExamples.map((prompt) => (
                <div
                  key={prompt}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-4 text-sm leading-6 text-[var(--foreground)]"
                >
                  {prompt}
                </div>
              ))}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/55 p-4 text-sm leading-6 text-[var(--foreground)]">
                Data freshness depends on when the latest sync completed. Use the
                latest sync metadata or `list_sync_runs` to confirm recency before
                making decisions.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
