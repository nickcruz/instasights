import { ArrowRight, LifeBuoy, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthControls } from "@/components/auth-controls";
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
import { buildRootHandoffPath, normalizeSameOriginReturnTo } from "@/lib/return-to";

type HomePageProps = {
  searchParams: Promise<{
    returnTo?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const appUrl = await getAppUrl();
  const session = await auth();
  const returnTo = normalizeSameOriginReturnTo(params.returnTo ?? null, appUrl);

  if (session && returnTo) {
    redirect(returnTo);
  }

  const signInCallbackUrl = returnTo
    ? buildRootHandoffPath(returnTo)
    : "/developers";
  const isConnectorResume = Boolean(returnTo);

  return (
    <main className="min-h-screen bg-white px-6 py-10 md:px-10">
      <div className="mx-auto grid max-w-5xl gap-6">
        <Card className="overflow-hidden bg-white/80 backdrop-blur">
          <CardContent className="grid gap-8 p-8 md:grid-cols-[1.1fr_0.9fr] md:p-10">
            <div className="space-y-5">
              <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--secondary)] px-4 py-1.5 text-sm text-[var(--secondary-foreground)]">
                {isConnectorResume ? "Connector sign-in" : "Instagram Insights"}
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                  Claude Desktop handoff
                </p>
                <h1 className="mt-3 max-w-3xl font-heading text-5xl leading-none md:text-7xl">
                  {isConnectorResume
                    ? "Finish Google sign-in and jump back to Claude."
                    : "Use this page when Claude asks you to finish Instagram Insights sign-in."}
                </h1>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
                {isConnectorResume
                  ? "Claude already handled connector consent. Sign in to Instagram Insights with Google here, and we will resume the connector flow back in Claude Desktop."
                  : "The hosted app completes the first-party Google login step for Instagram Insights, then hands control back to Claude for MCP access and later Instagram linking."}
              </p>
              <div className="flex flex-wrap gap-3">
                <AuthControls
                  isAuthenticated={Boolean(session)}
                  googleAvailable={isGoogleAuthConfigured}
                  callbackUrl={signInCallbackUrl}
                  signInLabel={
                    isConnectorResume
                      ? "Sign in with Google to continue"
                      : "Sign in with Google"
                  }
                />
                <Button asChild variant="outline">
                  <Link href="/developers">
                    Open support page
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(251,245,238,0.96),rgba(245,235,224,0.86))] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                What happens next
              </p>
              <div className="mt-4 space-y-4 text-sm text-[var(--foreground)]">
                <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="size-4 text-[var(--primary)]" />
                    Claude MCP consent first
                  </div>
                  <p className="mt-2 text-[var(--muted-foreground)]">
                    Claude handles the connector consent screen before sending
                    you here for Google sign-in.
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <ArrowRight className="size-4 text-[var(--primary)]" />
                    Resume automatically
                  </div>
                  <p className="mt-2 text-[var(--muted-foreground)]">
                    Once you finish Google sign-in, the app resumes the original
                    OAuth request and returns you to Claude Desktop.
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <LifeBuoy className="size-4 text-[var(--primary)]" />
                    Support lives on `/developers`
                  </div>
                  <p className="mt-2 text-[var(--muted-foreground)]">
                    Use the developers page for troubleshooting, status checks,
                    and legacy API-key workflows.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
