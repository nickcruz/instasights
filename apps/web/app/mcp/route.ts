import {
  createInstagramSyncRun,
  getInstagramAccountByUserId,
  getLatestActiveInstagramSyncRunByUserId,
  getLatestInstagramSyncRun,
  markInstagramSyncRunFailed,
  serializeSyncRunSummary,
  updateInstagramSyncRunProgress,
} from "@instagram-insights/db";
import { handleInstagramInsightsMcpRequest } from "@instagram-insights/mcp";
import { start } from "workflow/api";

import { requireMcpAccess } from "@/lib/mcp-oauth";
import { instagramFullSyncWorkflow } from "@/workflows/instagram-full-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const authResult = await requireMcpAccess(request);

  if (!authResult.ok) {
    return authResult.response;
  }

  return handleInstagramInsightsMcpRequest(request, {
    userId: authResult.auth.userId,
    triggerSync: async ({ userId, force = false, staleAfterHours = 24 }) => {
      const instagramAccount = await getInstagramAccountByUserId(userId);

      if (!instagramAccount) {
        return {
          error: "No linked Instagram account found for this API key owner.",
        };
      }

      if (!force) {
        const activeRun = await getLatestActiveInstagramSyncRunByUserId(userId);

        if (activeRun) {
          return {
            syncRun: serializeSyncRunSummary(activeRun),
            reusedExistingRun: true,
            queuedNewRun: false,
            reason: "An Instagram sync is already queued or running.",
          };
        }

        const latestRun = await getLatestInstagramSyncRun(userId);

        if (latestRun?.completedAt) {
          const ageMs = Date.now() - latestRun.completedAt.getTime();
          const staleAfterMs = staleAfterHours * 60 * 60 * 1000;

          if (ageMs < staleAfterMs) {
            return {
              syncRun: serializeSyncRunSummary(latestRun),
              reusedExistingRun: false,
              queuedNewRun: false,
              reason: `Latest sync is newer than ${staleAfterHours} hours.`,
            };
          }
        }
      }

      const syncRun = await createInstagramSyncRun({
        userId,
        instagramAccountId: instagramAccount.id,
        triggerType: "developer_api",
      });

      try {
        const run = await start(instagramFullSyncWorkflow, [
          {
            syncRunId: syncRun.id,
            userId,
            instagramAccountId: instagramAccount.id,
            triggerType: "developer_api",
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

        const queuedRun = await getLatestInstagramSyncRun(userId);

        return {
          syncRunId: syncRun.id,
          workflowRunId: run.runId,
          status: "queued",
          queuedNewRun: true,
          reusedExistingRun: false,
          syncRun: queuedRun ? serializeSyncRunSummary(queuedRun) : null,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Instagram sync failed.";

        await markInstagramSyncRunFailed({
          runId: syncRun.id,
          error: message,
          currentStep: "queue",
          progressPercent: 0,
        });

        return {
          error: message,
          queuedNewRun: false,
          reusedExistingRun: false,
        };
      }
    },
  });
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}

export async function DELETE(request: Request) {
  return handleRequest(request);
}
