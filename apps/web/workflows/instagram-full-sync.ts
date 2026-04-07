import { getWorkflowMetadata } from "workflow";

import type { GraphResponse } from "@/lib/instagram-sync";
import {
  chunkMediaCatalogStep,
  createBootstrapStep,
  createEmptyProgress,
  failRunStep,
  fetchAccountInsightsStep,
  fetchMediaCatalogStep,
  fetchMediaDetailBatchStep,
  fetchMediaMetricsBatchStep,
  fetchProfileStep,
  fetchTopMediaCommentsStep,
  filterRecentMediaCatalogStep,
  markRunProgress,
  mergeBundleManifestsStep,
  normalizeMediaBatchStep,
  persistSyncResultStep,
  loadInstagramAccount,
} from "@/workflows/instagram-full-sync-steps";

export type InstagramSyncWorkflowInput = {
  syncRunId: string;
  userId: string;
  instagramAccountId: string;
  triggerType: "manual" | "scheduled";
};

export async function instagramFullSyncWorkflow(
  input: InstagramSyncWorkflowInput,
) {
  "use workflow";

  const workflow = getWorkflowMetadata();
  let currentStep = "queued";
  let progressPercent = 0;
  let progress = createEmptyProgress();

  try {
    await markRunProgress({
      runId: input.syncRunId,
      status: "running",
      workflowRunId: workflow.workflowRunId,
      currentStep: "bootstrap",
      progressPercent: 5,
      statusMessage: "Workflow started",
      progress,
    });

    const link = await loadInstagramAccount({
      instagramAccountId: input.instagramAccountId,
      userId: input.userId,
    });

    const bootstrap = await createBootstrapStep(link);

    currentStep = "profile";
    progressPercent = 12;
    await markRunProgress({
      runId: input.syncRunId,
      status: "running",
      currentStep,
      progressPercent,
      statusMessage: "Fetching Instagram profile",
      progress,
    });

    const profile = await fetchProfileStep({
      link,
      apiVersion: bootstrap.apiVersion,
      baseUrl: bootstrap.baseUrl,
      manifest: bootstrap.manifest,
    });

    currentStep = "account-insights";
    progressPercent = 22;
    await markRunProgress({
      runId: input.syncRunId,
      status: "running",
      currentStep,
      progressPercent,
      statusMessage: "Fetching account insights",
      progress,
    });

    const accountInsights = await fetchAccountInsightsStep({
      canonicalAccountId: profile.canonicalAccountId,
      accessToken: link.accessToken,
      apiVersion: bootstrap.apiVersion,
      baseUrl: bootstrap.baseUrl,
      manifest: bootstrap.manifest,
    });

    currentStep = "media-catalog";
    progressPercent = 32;
    await markRunProgress({
      runId: input.syncRunId,
      status: "running",
      currentStep,
      progressPercent,
      statusMessage: "Fetching media catalog",
      progress,
    });

    const mediaCatalog = await fetchMediaCatalogStep({
      canonicalAccountId: profile.canonicalAccountId,
      accessToken: link.accessToken,
      apiVersion: bootstrap.apiVersion,
      baseUrl: bootstrap.baseUrl,
      manifest: bootstrap.manifest,
    });

    progress = {
      ...progress,
      mediaCatalogCount: mediaCatalog.length,
    };

    currentStep = "filter-recent-media";
    progressPercent = 40;
    await markRunProgress({
      runId: input.syncRunId,
      status: "running",
      currentStep,
      progressPercent,
      statusMessage: "Filtering media to the last 30 days",
      progress,
    });

    const recentMediaCatalog = await filterRecentMediaCatalogStep({
      mediaCatalog,
      manifest: bootstrap.manifest,
    });

    const bundles = await chunkMediaCatalogStep({
      syncRunId: input.syncRunId,
      mediaCatalog: recentMediaCatalog,
    });

    progress = {
      ...progress,
      recentMediaCount: recentMediaCatalog.length,
      totalBundles: bundles.length,
      completedBundles: 0,
      activeBundleLabel: bundles.length ? "Starting bundle fan-out" : null,
    };

    currentStep = "fetch-media-detail-batch";
    progressPercent = 48;
    await markRunProgress({
      runId: input.syncRunId,
      status: "running",
      currentStep,
      progressPercent,
      statusMessage:
        bundles.length > 0
          ? `Fetching media details across ${bundles.length} bundles`
          : "No recent media bundles to process",
      progress,
    });

    const detailBundles = await Promise.all(
      bundles.map((bundle) =>
        fetchMediaDetailBatchStep({
          runId: input.syncRunId,
          bundle,
          totalBundles: bundles.length,
          accessToken: link.accessToken,
          apiVersion: bootstrap.apiVersion,
          baseUrl: bootstrap.baseUrl,
          startedAt: bootstrap.startedAt,
          progress,
        }),
      ),
    );

    currentStep = "fetch-media-metrics-batch";
    progressPercent = 64;
    await markRunProgress({
      runId: input.syncRunId,
      status: "running",
      currentStep,
      progressPercent,
      statusMessage:
        bundles.length > 0
          ? `Fetching media metrics across ${bundles.length} bundles`
          : "No recent media metrics to fetch",
      progress,
    });

    const metricBundles = await Promise.all(
      detailBundles.map((bundleResult) =>
        fetchMediaMetricsBatchStep({
          runId: input.syncRunId,
          bundle: bundleResult.bundle,
          totalBundles: bundles.length,
          accessToken: link.accessToken,
          apiVersion: bootstrap.apiVersion,
          baseUrl: bootstrap.baseUrl,
          startedAt: bootstrap.startedAt,
          detailsByMediaId: bundleResult.detailsByMediaId,
          progress,
        }),
      ),
    );

    currentStep = "normalize-media-batch";
    progressPercent = 78;
    await markRunProgress({
      runId: input.syncRunId,
      status: "running",
      currentStep,
      progressPercent,
      statusMessage:
        bundles.length > 0
          ? `Normalizing ${recentMediaCatalog.length} recent media items`
          : "No recent media to normalize",
      progress,
    });

    const normalizedBundles = await Promise.all(
      metricBundles.map((bundleResult) =>
        normalizeMediaBatchStep({
          runId: input.syncRunId,
          bundle: bundleResult.bundle,
          totalBundles: bundles.length,
          apiVersion: bootstrap.apiVersion,
          baseUrl: bootstrap.baseUrl,
          startedAt: bootstrap.startedAt,
          mediaItems: bundleResult.mediaItems,
          progress,
        }),
      ),
    );

    progress = {
      ...progress,
      completedBundles: bundles.length,
      activeBundleLabel: null,
    };

    const mediaItems = normalizedBundles
      .flatMap((bundle) => bundle.mediaItems)
      .sort((a: GraphResponse, b: GraphResponse) => {
        const aTime =
          typeof a.timestamp === "string" ? new Date(a.timestamp).getTime() : 0;
        const bTime =
          typeof b.timestamp === "string" ? new Date(b.timestamp).getTime() : 0;

        if (bTime !== aTime) {
          return bTime - aTime;
        }

        return String(a.id ?? "").localeCompare(String(b.id ?? ""));
      });

    bootstrap.manifest = await mergeBundleManifestsStep({
      manifests: [
        bootstrap.manifest,
        ...detailBundles.map((bundle) => bundle.manifest),
        ...metricBundles.map((bundle) => bundle.manifest),
        ...normalizedBundles.map((bundle) => bundle.manifest),
      ],
    });

    currentStep = "comments";
    progressPercent = 88;
    await markRunProgress({
      runId: input.syncRunId,
      status: "running",
      currentStep,
      progressPercent,
      statusMessage: "Fetching top comments for recent media",
      progress,
    });

    await fetchTopMediaCommentsStep({
      accessToken: link.accessToken,
      apiVersion: bootstrap.apiVersion,
      baseUrl: bootstrap.baseUrl,
      mediaItems,
      manifest: bootstrap.manifest,
    });

    currentStep = "persist";
    progressPercent = 95;
    await markRunProgress({
      runId: input.syncRunId,
      status: "running",
      currentStep,
      progressPercent,
      statusMessage: "Persisting sync results",
      progress,
    });

    const summary = await persistSyncResultStep({
      syncRunId: input.syncRunId,
      userId: input.userId,
      instagramAccountId: input.instagramAccountId,
      startedAt: bootstrap.startedAt,
      apiVersion: bootstrap.apiVersion,
      canonicalAccountId: profile.canonicalAccountId,
      accountPayload: profile.accountPayload,
      accountInsights,
      mediaItems,
      manifest: bootstrap.manifest,
      fallbackUsername: link.username,
    });

    return {
      syncRunId: input.syncRunId,
      workflowRunId: workflow.workflowRunId,
      status: "completed" as const,
      summary,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Instagram sync failed.";

    await failRunStep({
      syncRunId: input.syncRunId,
      error: message,
      currentStep,
      progressPercent,
      progress,
    });

    throw error;
  }
}
