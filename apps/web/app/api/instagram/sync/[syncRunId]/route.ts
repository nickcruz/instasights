import {
  getInstagramSyncRunById,
  isDatabaseConfigured,
} from "@instagram-insights/db";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    syncRunId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
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

  const { syncRunId } = await context.params;
  const syncRun = await getInstagramSyncRunById({
    runId: syncRunId,
    userId,
  });

  if (!syncRun) {
    return NextResponse.json({ error: "Sync run not found." }, { status: 404 });
  }

  return NextResponse.json({
    syncRunId: syncRun.id,
    workflowRunId: syncRun.workflowRunId,
    triggerType: syncRun.triggerType,
    status: syncRun.status,
    currentStep: syncRun.currentStep,
    progressPercent: syncRun.progressPercent,
    statusMessage: syncRun.statusMessage,
    error: syncRun.error,
    startedAt: syncRun.startedAt.toISOString(),
    completedAt: syncRun.completedAt?.toISOString() ?? null,
    lastHeartbeatAt: syncRun.lastHeartbeatAt?.toISOString() ?? null,
    mediaCount: syncRun.mediaCount ?? null,
    warningCount: syncRun.warningCount ?? null,
    summary: syncRun.summary ?? null,
  });
}
