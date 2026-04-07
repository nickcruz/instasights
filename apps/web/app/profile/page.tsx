import {
  getInstagramAccountByUserId,
  getLatestInstagramSyncRun,
  isDatabaseConfigured,
} from "@instagram-insights/db";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth, isGoogleAuthConfigured } from "@/lib/auth";
import { isInstagramConfigured } from "@/lib/instagram-oauth";
import { InstagramLinkCard } from "@/components/instagram-link-card";
import { ManualSyncCard } from "@/components/manual-sync-card";

type ProfilePageProps = {
  searchParams: Promise<{
    instagram?: string;
    message?: string;
  }>;
};

export default async function ProfilePage({
  searchParams,
}: ProfilePageProps) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const params = await searchParams;
  const userId = session.user?.id;
  const instagramAccount =
    userId && isDatabaseConfigured
      ? await getInstagramAccountByUserId(userId)
      : null;
  const latestSyncRun =
    userId && isDatabaseConfigured
      ? await getLatestInstagramSyncRun(userId)
      : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(194,123,63,0.20),transparent_34%),linear-gradient(180deg,#f7efe2_0%,#f3eadc_35%,#efe4d6_100%)] px-6 py-10 md:px-10">
      <div className="mx-auto grid max-w-5xl gap-6">
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              This signed-in app user is the owner for future Instagram tokens,
              syncs, transcripts, and dashboard data.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-4">
              <p className="text-sm text-[var(--muted-foreground)]">Name</p>
              <p className="mt-2 text-lg font-semibold">
                {session.user?.name ?? "Unknown"}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-4">
              <p className="text-sm text-[var(--muted-foreground)]">Email</p>
              <p className="mt-2 text-lg font-semibold">
                {session.user?.email ?? "Unknown"}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-4">
              <p className="text-sm text-[var(--muted-foreground)]">
                Authentication state
              </p>
              <p className="mt-2 text-lg font-semibold">
                {isGoogleAuthConfigured
                  ? "Google OAuth enabled"
                  : "Google OAuth env vars missing"}
              </p>
            </div>
          </CardContent>
        </Card>

        <InstagramLinkCard
          instagramLink={instagramAccount}
          signedIn
          instagramConfigured={isInstagramConfigured() && isDatabaseConfigured}
          status={params.instagram ?? null}
          message={params.message ?? null}
        />

        <ManualSyncCard
          enabled={Boolean(instagramAccount)}
          latestSyncRun={
            latestSyncRun
              ? {
                  syncRunId: latestSyncRun.id,
                  workflowRunId: latestSyncRun.workflowRunId ?? null,
                  triggerType: latestSyncRun.triggerType ?? null,
                  status: latestSyncRun.status,
                  currentStep: latestSyncRun.currentStep ?? null,
                  progressPercent: latestSyncRun.progressPercent ?? null,
                  statusMessage: latestSyncRun.statusMessage ?? null,
                  error: latestSyncRun.error ?? null,
                  startedAt: latestSyncRun.startedAt.toISOString(),
                  completedAt: latestSyncRun.completedAt?.toISOString() ?? null,
                  lastHeartbeatAt:
                    latestSyncRun.lastHeartbeatAt?.toISOString() ?? null,
                  mediaCount: latestSyncRun.mediaCount ?? null,
                  warningCount: latestSyncRun.warningCount ?? null,
                  progress:
                    latestSyncRun.progress &&
                    typeof latestSyncRun.progress === "object" &&
                    !Array.isArray(latestSyncRun.progress)
                      ? (latestSyncRun.progress as {
                          mediaCatalogCount?: number;
                          recentMediaCount?: number;
                          totalBundles?: number;
                          completedBundles?: number;
                          activeBundleLabel?: string | null;
                        })
                      : null,
                  summary:
                    latestSyncRun.summary &&
                    typeof latestSyncRun.summary === "object" &&
                    !Array.isArray(latestSyncRun.summary)
                      ? (latestSyncRun.summary as {
                          username: string;
                          mediaCount: number;
                          warningCount: number;
                          topMediaIds: Array<string | null | undefined>;
                          durationSeconds: number;
                        })
                      : null,
                }
              : null
          }
        />
      </div>
    </main>
  );
}
