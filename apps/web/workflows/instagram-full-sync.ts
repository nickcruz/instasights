import {
  FatalError,
  getWorkflowMetadata,
} from "workflow";
import {
  getInstagramAccountById,
  markInstagramSyncRunFailed,
  persistInstagramSyncResult,
  updateInstagramSyncRunProgress,
} from "@instagram-insights/db";

import {
  createInstagramSyncBootstrap,
  finalizeInstagramSyncResult,
  runInstagramAccountInsightsStage,
  runInstagramMediaBundleStage,
  runInstagramMediaCatalogStage,
  runInstagramProfileStage,
  runInstagramTopMediaCommentsStage,
  type GraphResponse,
  type Manifest,
} from "@/lib/instagram-sync";

export type InstagramSyncWorkflowInput = {
  syncRunId: string;
  userId: string;
  instagramAccountId: string;
  triggerType: "manual" | "scheduled";
};

type InstagramWorkflowLink = {
  accessToken: string;
  instagramUserId: string;
  username: string;
  graphApiVersion: string;
};

async function markRunProgress(input: {
  runId: string;
  status?: "queued" | "running" | "completed" | "failed";
  workflowRunId?: string;
  currentStep?: string | null;
  progressPercent?: number | null;
  statusMessage?: string | null;
}) {
  "use step";

  await updateInstagramSyncRunProgress({
    runId: input.runId,
    status: input.status,
    workflowRunId: input.workflowRunId,
    currentStep: input.currentStep,
    progressPercent: input.progressPercent,
    statusMessage: input.statusMessage,
  });
}

async function loadInstagramAccount(input: {
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

async function createBootstrapStep(link: InstagramWorkflowLink) {
  "use step";

  return createInstagramSyncBootstrap(link);
}

async function fetchProfileStep(input: {
  link: InstagramWorkflowLink;
  apiVersion: string;
  baseUrl: string;
  manifest: Manifest;
}) {
  "use step";

  return runInstagramProfileStage(input);
}

async function fetchAccountInsightsStep(input: {
  canonicalAccountId: string;
  accessToken: string;
  apiVersion: string;
  baseUrl: string;
  manifest: Manifest;
}) {
  "use step";

  return runInstagramAccountInsightsStage(input);
}

async function fetchMediaCatalogStep(input: {
  canonicalAccountId: string;
  accessToken: string;
  apiVersion: string;
  baseUrl: string;
  manifest: Manifest;
}) {
  "use step";

  return runInstagramMediaCatalogStage(input);
}

async function fetchMediaBundleStep(input: {
  accessToken: string;
  apiVersion: string;
  baseUrl: string;
  mediaCatalog: GraphResponse[];
  manifest: Manifest;
}) {
  "use step";

  return runInstagramMediaBundleStage(input);
}

async function fetchTopMediaCommentsStep(input: {
  accessToken: string;
  apiVersion: string;
  baseUrl: string;
  mediaItems: GraphResponse[];
  manifest: Manifest;
}) {
  "use step";

  return runInstagramTopMediaCommentsStage(input);
}

async function persistSyncResultStep(input: {
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

async function failRunStep(input: {
  syncRunId: string;
  error: string;
  currentStep?: string | null;
  progressPercent?: number | null;
}) {
  "use step";

  await markInstagramSyncRunFailed({
    runId: input.syncRunId,
    error: input.error,
    currentStep: input.currentStep,
    progressPercent: input.progressPercent,
  });
}

export async function instagramFullSyncWorkflow(
  input: InstagramSyncWorkflowInput,
) {
  "use workflow";

  const workflow = getWorkflowMetadata();
  let currentStep = "queued";
  let progressPercent = 0;

  try {
    await markRunProgress({
      runId: input.syncRunId,
      status: "running",
      workflowRunId: workflow.workflowRunId,
      currentStep: "bootstrap",
      progressPercent: 5,
      statusMessage: "Workflow started",
    });

    const link = await loadInstagramAccount({
      instagramAccountId: input.instagramAccountId,
      userId: input.userId,
    });

    currentStep = "profile";
    progressPercent = 15;
    await markRunProgress({
      runId: input.syncRunId,
      status: "running",
      currentStep,
      progressPercent,
      statusMessage: "Fetching Instagram profile",
    });

    const bootstrap = await createBootstrapStep(link);
    const profile = await fetchProfileStep({
      link,
      apiVersion: bootstrap.apiVersion,
      baseUrl: bootstrap.baseUrl,
      manifest: bootstrap.manifest,
    });

    currentStep = "account-insights";
    progressPercent = 35;
    await markRunProgress({
      runId: input.syncRunId,
      status: "running",
      currentStep,
      progressPercent,
      statusMessage: "Fetching account insights",
    });

    const accountInsights = await fetchAccountInsightsStep({
      canonicalAccountId: profile.canonicalAccountId,
      accessToken: link.accessToken,
      apiVersion: bootstrap.apiVersion,
      baseUrl: bootstrap.baseUrl,
      manifest: bootstrap.manifest,
    });

    currentStep = "media-catalog";
    progressPercent = 50;
    await markRunProgress({
      runId: input.syncRunId,
      status: "running",
      currentStep,
      progressPercent,
      statusMessage: "Fetching media catalog",
    });

    const mediaCatalog = await fetchMediaCatalogStep({
      canonicalAccountId: profile.canonicalAccountId,
      accessToken: link.accessToken,
      apiVersion: bootstrap.apiVersion,
      baseUrl: bootstrap.baseUrl,
      manifest: bootstrap.manifest,
    });

    currentStep = "media-insights";
    progressPercent = 70;
    await markRunProgress({
      runId: input.syncRunId,
      status: "running",
      currentStep,
      progressPercent,
      statusMessage: "Fetching media details and insights",
    });

    const mediaItems = await fetchMediaBundleStep({
      accessToken: link.accessToken,
      apiVersion: bootstrap.apiVersion,
      baseUrl: bootstrap.baseUrl,
      mediaCatalog,
      manifest: bootstrap.manifest,
    });

    currentStep = "comments";
    progressPercent = 85;
    await markRunProgress({
      runId: input.syncRunId,
      status: "running",
      currentStep,
      progressPercent,
      statusMessage: "Fetching top media comments",
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
    });

    throw error;
  }
}
