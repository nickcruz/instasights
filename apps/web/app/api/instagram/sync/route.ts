import {
  createInstagramSyncRun,
  getInstagramAccountByUserId,
  isDatabaseConfigured,
  markInstagramSyncRunFailed,
  persistInstagramSyncResult,
} from "@instagram-insights/db";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { runInstagramFullSync } from "@/lib/instagram-sync";

export const runtime = "nodejs";
export const maxDuration = 900;

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
  });

  try {
    const result = await runInstagramFullSync({
      accessToken: instagramAccount.accessToken,
      instagramUserId: instagramAccount.instagramUserId,
      username: instagramAccount.username ?? "",
      issuedAt: instagramAccount.tokenIssuedAt?.toISOString() ?? "",
      linkedAt: instagramAccount.linkedAt.toISOString(),
      graphApiVersion: instagramAccount.graphApiVersion,
      authAppUrl: instagramAccount.authAppUrl ?? "",
    });
    await persistInstagramSyncResult({
      runId: syncRun.id,
      userId,
      instagramAccountId: instagramAccount.id,
      report: result.report,
      summary: result.summary,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Instagram sync failed.";
    await markInstagramSyncRunFailed({
      runId: syncRun.id,
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
