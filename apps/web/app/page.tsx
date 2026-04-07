import {
  getInstagramAccountByUserId,
  isDatabaseConfigured,
} from "@instagram-insights/db";
import { ArrowRight, Database, Mic, Radar } from "lucide-react";
import Link from "next/link";

import { AuthControls } from "@/components/auth-controls";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth, isGoogleAuthConfigured } from "@/lib/auth";
import { isInstagramConfigured } from "@/lib/instagram-oauth";

const pillars = [
  {
    icon: Radar,
    title: "OAuth and account ownership",
    body: "Users will sign in with Google, connect Instagram, and keep token state tied to their app account instead of a local skill folder.",
  },
  {
    icon: Database,
    title: "Background ingestion",
    body: "A durable sync pipeline will move the existing full-sync behavior into a DB-backed system with account, media, metrics, and run history.",
  },
  {
    icon: Mic,
    title: "10-second hook transcripts",
    body: "New video media will fan out to a dedicated Whisper service so we can persist short transcript hooks for downstream UI and MCP usage.",
  },
];

export default async function HomePage() {
  const session = await auth();
  const instagramAccount =
    session?.user?.id && isDatabaseConfigured
      ? await getInstagramAccountByUserId(session.user.id)
      : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(194,123,63,0.20),transparent_34%),linear-gradient(180deg,#f7efe2_0%,#f3eadc_35%,#efe4d6_100%)] text-[var(--foreground)]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 md:px-10">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
              Vercel App Foundation
            </p>
            <h1 className="mt-3 max-w-2xl font-heading text-5xl leading-none md:text-7xl">
              Instagram insights, rebuilt around the app instead of the skill.
            </h1>
          </div>
          <div className="hidden rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-sm text-[var(--muted-foreground)] shadow-sm md:block">
            App Router + TypeScript + shadcn/ui
          </div>
        </div>

        <Card className="overflow-hidden bg-white/80 backdrop-blur">
          <CardContent className="grid gap-10 p-8 md:grid-cols-[1.35fr_0.85fr] md:p-10">
            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--secondary)] px-4 py-1.5 text-sm text-[var(--secondary-foreground)]">
                Phase 1: web app creation
              </div>
              <p className="max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
                This first slice gives us the deployable shell we can build on
                next: app auth with NextAuth, Instagram connection routes,
                Drizzle-backed persistence, workflow-driven syncs, and the MCP
                interface.
              </p>
              <div className="flex flex-wrap gap-3">
                <AuthControls
                  isAuthenticated={Boolean(session)}
                  googleAvailable={isGoogleAuthConfigured}
                />
                <Button asChild size="lg" variant="outline">
                  <Link href={session ? "/profile" : "#"}>
                    {session ? "Open profile" : "Profile appears after sign-in"}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(251,245,238,0.96),rgba(245,235,224,0.86))] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                Initial workspace map
              </p>
              <pre className="mt-4 overflow-x-auto rounded-[20px] bg-[var(--popover)] p-5 font-mono text-sm leading-7 text-[var(--foreground)]">
{`apps/
  web/
packages/
  contracts/
  db/
  mcp/
services/
  transcriber/
skills/
  instagram-insights-fetch/
  instagram-insights-report/`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, body }) => (
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

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Card className="bg-white/75 backdrop-blur">
            <CardHeader>
              <CardTitle>Google app auth</CardTitle>
              <CardDescription>
                The NextAuth layer owns the app session before any Instagram
                account is linked.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <p>
                Status:{" "}
                <span className="font-semibold text-[var(--foreground)]">
                  {session
                    ? `Signed in as ${session.user?.email ?? "user"}`
                    : isGoogleAuthConfigured
                      ? "Ready for Google OAuth"
                      : "Missing Google OAuth env vars"}
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/75 backdrop-blur">
            <CardHeader>
              <CardTitle>Instagram account link</CardTitle>
              <CardDescription>
                The signed-in user can link an Instagram account through the
                Meta OAuth flow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <p>
                Status:{" "}
                <span className="font-semibold text-[var(--foreground)]">
                  {instagramAccount
                    ? `Linked @${instagramAccount.username || "unknown"}`
                    : isInstagramConfigured() && isDatabaseConfigured
                      ? "Ready to link"
                      : "Missing Instagram OAuth or database env vars"}
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
