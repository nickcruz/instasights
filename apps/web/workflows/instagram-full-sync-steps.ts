import { FatalError } from "workflow";
import {
  getInstagramAccountById,
  markInstagramSyncRunFailed,
  persistInstagramSyncResult,
  updateInstagramSyncRunProgress,
} from "@instagram-insights/db";

import {
  chunkMediaCatalog,
  createInstagramSyncBootstrap,
  fetchMediaDetailBatch,
  fetchMediaMetricsBatch,
  filterRecentMediaCatalog,
  finalizeInstagramSyncResult,
  mergeManifestFragments,
  normalizeMediaBatch,
  runInstagramAccountInsightsStage,
  runInstagramMediaCatalogStage,
  runInstagramProfileStage,
  runInstagramTopMediaCommentsStage,
  type GraphResponse,
  type Manifest,
  type MediaBundle,
} from "@/lib/instagram-sync";

export type InstagramWorkflowLink = {
  accessToken: string;
  instagramUserId: string;
  username: string;
  graphApiVersion: string;
};

export type SyncRunProgressState = {
  mediaCatalogCount: number;
  recentMediaCount: number;
  totalBundles: number;
  completedBundles: number;
  activeBundleLabel: string | null;
};

export type MediaDetailBundleResult = {
  bundle: MediaBundle;
  detailsByMediaId: Record<string, GraphResponse>;
  manifest: Manifest;
};

export type MediaMetricsBundleResult = {
  bundle: MediaBundle;
  mediaItems: GraphResponse[];
  manifest: Manifest;
};

export function createEmptyProgress(): SyncRunProgressState {
  return {
    mediaCatalogCount: 0,
    recentMediaCount: 0,
    totalBundles: 0,
    completedBundles: 0,
    activeBundleLabel: null,
  };
}

export function bundleLabel(bundle: MediaBundle, totalBundles: number) {
  return `Bundle ${bundle.bundleIndex + 1}/${Math.max(totalBundles, 1)}`;
}

export async function markRunProgress(input: {
  runId: string;
  status?: "queued" | "running" | "completed" | "failed";
  workflowRunId?: string;
  currentStep?: string | null;
  progressPercent?: number | null;
  statusMessage?: string | null;
  progress?: SyncRunProgressState | null;
}) {
  "use step";

  await updateInstagramSyncRunProgress({
    runId: input.runId,
    status: input.status,
    workflowRunId: input.workflowRunId,
    currentStep: input.currentStep,
    progressPercent: input.progressPercent,
    statusMessage: input.statusMessage,
    progress: input.progress,
  });
}

export async function loadInstagramAccount(input: {
  instagramAccountId: string;
  userId: string;
}) {
  "use step";

  const account = await getInstagramAccountById(input);

  if (!account) {
    throw new FatalError("Linked Instagram account not found.");
  }

  return {
    accessToken: account.accessToken,
    instagramUserId: account.instagramUserId,
    username: account.username ?? "",
    graphApiVersion: account.graphApiVersion,
  } satisfies InstagramWorkflowLink;
}

export async function createBootstrapStep(link: InstagramWorkflowLink) {
  "use step";

  return createInstagramSyncBootstrap(link);
}

export async function fetchProfileStep(input: {
  link: InstagramWorkflowLink;
  apiVersion: string;
  baseUrl: string;
  manifest: Manifest;
}) {
  "use step";

  return runInstagramProfileStage(input);
}

export async function fetchAccountInsightsStep(input: {
  canonicalAccountId: string;
  accessToken: string;
  apiVersion: string;
  baseUrl: string;
  manifest: Manifest;
}) {
  "use step";

  return runInstagramAccountInsightsStage(input);
}

export async function fetchMediaCatalogStep(input: {
  canonicalAccountId: string;
  accessToken: string;
  apiVersion: string;
  baseUrl: string;
  manifest: Manifest;
}) {
  "use step";

  return runInstagramMediaCatalogStage(input);
}

export async function filterRecentMediaCatalogStep(input: {
  mediaCatalog: GraphResponse[];
  manifest: Manifest;
}) {
  "use step";

  return filterRecentMediaCatalog({
    mediaCatalog: input.mediaCatalog,
    manifest: input.manifest,
    windowDays: 30,
  });
}

export async function chunkMediaCatalogStep(input: {
  syncRunId: string;
  mediaCatalog: GraphResponse[];
}) {
  "use step";

  return chunkMediaCatalog({
    syncRunId: input.syncRunId,
    mediaCatalog: input.mediaCatalog,
    chunkSize: 10,
  });
}

export async function fetchMediaDetailBatchStep(input: {
  runId: string;
  bundle: MediaBundle;
  totalBundles: number;
  accessToken: string;
  apiVersion: string;
  baseUrl: string;
  startedAt: string;
  progress: SyncRunProgressState;
}) {
  "use step";

  const label = bundleLabel(input.bundle, input.totalBundles);
  await updateInstagramSyncRunProgress({
    runId: input.runId,
    currentStep: "fetch-media-detail-batch",
    statusMessage: `${label}: fetching media details`,
    progress: {
      ...input.progress,
      activeBundleLabel: label,
    },
  });

  const result = await fetchMediaDetailBatch({
    bundle: input.bundle,
    baseUrl: input.baseUrl,
    apiVersion: input.apiVersion,
    accessToken: input.accessToken,
    startedAt: input.startedAt,
  });

  return {
    bundle: input.bundle,
    detailsByMediaId: result.detailsByMediaId,
    manifest: result.manifest,
  } satisfies MediaDetailBundleResult;
}

export async function fetchMediaMetricsBatchStep(input: {
  runId: string;
  bundle: MediaBundle;
  totalBundles: number;
  accessToken: string;
  apiVersion: string;
  baseUrl: string;
  startedAt: string;
  detailsByMediaId: Record<string, GraphResponse>;
  progress: SyncRunProgressState;
}) {
  "use step";

  const label = bundleLabel(input.bundle, input.totalBundles);
  await updateInstagramSyncRunProgress({
    runId: input.runId,
    currentStep: "fetch-media-metrics-batch",
    statusMessage: `${label}: fetching media metrics`,
    progress: {
      ...input.progress,
      activeBundleLabel: label,
    },
  });

  const result = await fetchMediaMetricsBatch({
    bundle: input.bundle,
    detailsByMediaId: input.detailsByMediaId,
    baseUrl: input.baseUrl,
    apiVersion: input.apiVersion,
    accessToken: input.accessToken,
    startedAt: input.startedAt,
  });

  return {
    bundle: input.bundle,
    mediaItems: result.mediaItems,
    manifest: result.manifest,
  } satisfies MediaMetricsBundleResult;
}

export async function normalizeMediaBatchStep(input: {
  runId: string;
  bundle: MediaBundle;
  totalBundles: number;
  apiVersion: string;
  baseUrl: string;
  startedAt: string;
  mediaItems: GraphResponse[];
  progress: SyncRunProgressState;
}) {
  "use step";

  const label = bundleLabel(input.bundle, input.totalBundles);
  await updateInstagramSyncRunProgress({
    runId: input.runId,
    currentStep: "normalize-media-batch",
    statusMessage: `${label}: normalizing media`,
    progress: {
      ...input.progress,
      activeBundleLabel: label,
    },
  });

  const result = normalizeMediaBatch({
    bundle: input.bundle,
    mediaItems: input.mediaItems,
    startedAt: input.startedAt,
    apiVersion: input.apiVersion,
    baseUrl: input.baseUrl,
  });

  return {
    bundle: input.bundle,
    mediaItems: result.mediaItems,
    manifest: result.manifest,
  } satisfies MediaMetricsBundleResult;
}

export async function fetchTopMediaCommentsStep(input: {
  accessToken: string;
  apiVersion: string;
  baseUrl: string;
  mediaItems: GraphResponse[];
  manifest: Manifest;
}) {
  "use step";

  return runInstagramTopMediaCommentsStage(input);
}

export async function mergeBundleManifestsStep(input: {
  manifests: Manifest[];
}) {
  "use step";

  return mergeManifestFragments(input.manifests);
}

export async function persistSyncResultStep(input: {
  syncRunId: string;
  userId: string;
  instagramAccountId: string;
  startedAt: string;
  apiVersion: string;
  canonicalAccountId: string;
  accountPayload: GraphResponse;
  accountInsights: GraphResponse;
  mediaItems: GraphResponse[];
  manifest: Manifest;
  fallbackUsername: string;
}) {
  "use step";

  const result = finalizeInstagramSyncResult({
    startedAt: input.startedAt,
    apiVersion: input.apiVersion,
    canonicalAccountId: input.canonicalAccountId,
    accountPayload: input.accountPayload,
    accountInsights: input.accountInsights,
    mediaItems: input.mediaItems,
    manifest: input.manifest,
    fallbackUsername: input.fallbackUsername,
  });

  await persistInstagramSyncResult({
    runId: input.syncRunId,
    userId: input.userId,
    instagramAccountId: input.instagramAccountId,
    report: result.report,
    summary: result.summary,
  });

  return result.summary;
}

export async function failRunStep(input: {
  syncRunId: string;
  error: string;
  currentStep?: string | null;
  progressPercent?: number | null;
  progress?: SyncRunProgressState | null;
}) {
  "use step";

  await markInstagramSyncRunFailed({
    runId: input.syncRunId,
    error: input.error,
    currentStep: input.currentStep,
    progressPercent: input.progressPercent,
    progress: input.progress,
  });
}
