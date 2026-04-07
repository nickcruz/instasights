import {
  createInstagramSyncRun,
  getInstagramAccountByUserId,
  isDatabaseConfigured,
  markInstagramSyncRunFailed,
  updateInstagramSyncRunProgress,
} from "@instagram-insights/db";
import { NextResponse } from "next/server";
import { start } from "workflow/api";

import { auth } from "@/lib/auth";
import { instagramFullSyncWorkflow } from "@/workflows/instagram-full-sync";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!session || !userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!isDatabaseConfigured) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  const instagramAccount = await getInstagramAccountByUserId(userId);

  if (!instagramAccount) {
    return NextResponse.json(
      { error: "No linked Instagram account found for this user." },
      { status: 400 },
    );
  }

  const syncRun = await createInstagramSyncRun({
    userId,
    instagramAccountId: instagramAccount.id,
    triggerType: "manual",
  });

  try {
    const run = await start(instagramFullSyncWorkflow, [
      {
        syncRunId: syncRun.id,
        userId,
        instagramAccountId: instagramAccount.id,
        triggerType: "manual",
      },
    ]);

    await updateInstagramSyncRunProgress({
      runId: syncRun.id,
      status: "queued",
      workflowRunId: run.runId,
      currentStep: "queued",
      progressPercent: 0,
      statusMessage: "Sync queued",
    });

    return NextResponse.json(
      {
        syncRunId: syncRun.id,
        workflowRunId: run.runId,
        status: "queued",
      },
      { status: 202 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Instagram sync failed.";
    await markInstagramSyncRunFailed({
      runId: syncRun.id,
      error: message,
      currentStep: "queue",
      progressPercent: 0,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
