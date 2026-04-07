import { and, desc, eq } from "drizzle-orm";

import { getDb } from "./client";
import {
  instagramAccountSnapshots,
  instagramAccounts,
  instagramMediaItems,
  instagramSyncRuns,
} from "./schema";

type InstagramAccountInput = {
  userId: string;
  instagramUserId: string;
  username: string;
  accessToken: string;
  graphApiVersion: string;
  authAppUrl: string;
  tokenIssuedAt: Date;
  linkedAt: Date;
  rawProfile?: Record<string, unknown>;
};

type SyncResultInput = {
  runId: string;
  userId: string;
  instagramAccountId: string;
  report: {
    account: Record<string, unknown>;
    account_insights: Record<string, unknown>;
    analysis_facts: Record<string, unknown>;
    highlights: Record<string, unknown>;
    warnings: string[];
    fetch_manifest: Record<string, unknown>;
    media: Array<Record<string, unknown>>;
  };
  summary: {
    mediaCount: number;
    warningCount: number;
    durationSeconds: number;
  };
};

type SyncRunStatus = "queued" | "running" | "completed" | "failed";

function toDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function getInstagramAccountByUserId(userId: string) {
  return (
    await getDb()
      .select()
      .from(instagramAccounts)
      .where(eq(instagramAccounts.userId, userId))
      .limit(1)
  )[0] ?? null;
}

export async function getInstagramAccountById(input: {
  instagramAccountId: string;
  userId: string;
}) {
  return (
    await getDb()
      .select()
      .from(instagramAccounts)
      .where(
        and(
          eq(instagramAccounts.id, input.instagramAccountId),
          eq(instagramAccounts.userId, input.userId),
        ),
      )
      .limit(1)
  )[0] ?? null;
}

export async function upsertInstagramAccount(input: InstagramAccountInput) {
  const now = new Date();

  return (
    await getDb()
      .insert(instagramAccounts)
      .values({
        userId: input.userId,
        instagramUserId: input.instagramUserId,
        username: input.username,
        accessToken: input.accessToken,
        graphApiVersion: input.graphApiVersion,
        authAppUrl: input.authAppUrl,
        tokenIssuedAt: input.tokenIssuedAt,
        linkedAt: input.linkedAt,
        rawProfile: input.rawProfile ?? null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: instagramAccounts.userId,
        set: {
          instagramUserId: input.instagramUserId,
          username: input.username,
          accessToken: input.accessToken,
          graphApiVersion: input.graphApiVersion,
          authAppUrl: input.authAppUrl,
          tokenIssuedAt: input.tokenIssuedAt,
          linkedAt: input.linkedAt,
          rawProfile: input.rawProfile ?? null,
          updatedAt: now,
        },
      })
      .returning()
  )[0];
}

export async function createInstagramSyncRun(input: {
  userId: string;
  instagramAccountId: string;
  triggerType?: string;
}) {
  return (
    await getDb()
      .insert(instagramSyncRuns)
      .values({
        userId: input.userId,
        instagramAccountId: input.instagramAccountId,
        status: "queued",
        triggerType: input.triggerType ?? "manual",
        progressPercent: 0,
        statusMessage: "Queued",
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
  )[0];
}

export async function getInstagramSyncRunById(input: {
  runId: string;
  userId: string;
}) {
  return (
    await getDb()
      .select()
      .from(instagramSyncRuns)
      .where(
        and(
          eq(instagramSyncRuns.id, input.runId),
          eq(instagramSyncRuns.userId, input.userId),
        ),
      )
      .limit(1)
  )[0] ?? null;
}

export async function updateInstagramSyncRunProgress(input: {
  runId: string;
  status?: SyncRunStatus;
  workflowRunId?: string;
  currentStep?: string | null;
  progressPercent?: number | null;
  statusMessage?: string | null;
  startedAt?: Date;
  lastHeartbeatAt?: Date;
}) {
  const now = new Date();

  return (
    await getDb()
      .update(instagramSyncRuns)
      .set({
        status: input.status,
        workflowRunId: input.workflowRunId,
        currentStep: input.currentStep,
        progressPercent: input.progressPercent,
        statusMessage: input.statusMessage,
        startedAt: input.startedAt,
        lastHeartbeatAt: input.lastHeartbeatAt ?? now,
        updatedAt: now,
      })
      .where(eq(instagramSyncRuns.id, input.runId))
      .returning()
  )[0];
}

export async function markInstagramSyncRunFailed(input: {
  runId: string;
  error: string;
  currentStep?: string | null;
  progressPercent?: number | null;
  statusMessage?: string | null;
}) {
  return (
    await getDb()
      .update(instagramSyncRuns)
      .set({
        status: "failed",
        error: input.error,
        currentStep: input.currentStep,
        progressPercent: input.progressPercent,
        statusMessage: input.statusMessage ?? input.error,
        lastHeartbeatAt: new Date(),
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(instagramSyncRuns.id, input.runId))
      .returning()
  )[0];
}

export async function persistInstagramSyncResult(input: SyncResultInput) {
  const db = getDb();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(instagramAccounts)
      .set({
        username:
          typeof input.report.account.username === "string"
            ? input.report.account.username
            : null,
        rawProfile: input.report.account,
        lastSyncedAt: now,
        updatedAt: now,
      })
      .where(eq(instagramAccounts.id, input.instagramAccountId));

    await tx
      .update(instagramSyncRuns)
      .set({
        status: "completed",
        currentStep: "persist",
        progressPercent: 100,
        statusMessage: "Sync completed",
        lastHeartbeatAt: now,
        completedAt: now,
        durationSeconds: input.summary.durationSeconds,
        mediaCount: input.summary.mediaCount,
        warningCount: input.summary.warningCount,
        summary: input.summary,
        report: input.report,
        updatedAt: now,
      })
      .where(eq(instagramSyncRuns.id, input.runId));

    await tx
      .insert(instagramAccountSnapshots)
      .values({
        syncRunId: input.runId,
        instagramAccountId: input.instagramAccountId,
        account: input.report.account,
        accountInsights: input.report.account_insights,
        analysisFacts: input.report.analysis_facts,
        highlights: input.report.highlights,
        warnings: input.report.warnings,
        fetchManifest: input.report.fetch_manifest,
      })
      .onConflictDoUpdate({
        target: instagramAccountSnapshots.syncRunId,
        set: {
          account: input.report.account,
          accountInsights: input.report.account_insights,
          analysisFacts: input.report.analysis_facts,
          highlights: input.report.highlights,
          warnings: input.report.warnings,
          fetchManifest: input.report.fetch_manifest,
        },
      });

    for (const media of input.report.media) {
      const mediaId = typeof media.id === "string" ? media.id : null;
      if (!mediaId) {
        continue;
      }

      await tx
        .insert(instagramMediaItems)
        .values({
          id: mediaId,
          instagramAccountId: input.instagramAccountId,
          userId: input.userId,
          lastSyncRunId: input.runId,
          caption: typeof media.caption === "string" ? media.caption : null,
          commentsCount:
            typeof media.comments_count === "number" ? media.comments_count : null,
          likeCount: typeof media.like_count === "number" ? media.like_count : null,
          mediaProductType:
            typeof media.media_product_type === "string"
              ? media.media_product_type
              : null,
          mediaType: typeof media.media_type === "string" ? media.media_type : null,
          mediaUrl: typeof media.media_url === "string" ? media.media_url : null,
          thumbnailUrl:
            typeof media.thumbnail_url === "string" ? media.thumbnail_url : null,
          previewUrl:
            typeof media.preview_url === "string" ? media.preview_url : null,
          permalink: typeof media.permalink === "string" ? media.permalink : null,
          shortcode: typeof media.shortcode === "string" ? media.shortcode : null,
          postedAt: toDate(media.timestamp),
          username: typeof media.username === "string" ? media.username : null,
          isCommentEnabled:
            typeof media.is_comment_enabled === "boolean"
              ? media.is_comment_enabled
              : null,
          topComments: Array.isArray(media.top_comments) ? media.top_comments : null,
          insights:
            media.insights && typeof media.insights === "object"
              ? media.insights
              : null,
          warnings: Array.isArray(media.warnings) ? media.warnings : null,
          errors: Array.isArray(media.errors) ? media.errors : null,
          raw: media,
          syncedAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: instagramMediaItems.id,
          set: {
            instagramAccountId: input.instagramAccountId,
            userId: input.userId,
            lastSyncRunId: input.runId,
            caption: typeof media.caption === "string" ? media.caption : null,
            commentsCount:
              typeof media.comments_count === "number" ? media.comments_count : null,
            likeCount:
              typeof media.like_count === "number" ? media.like_count : null,
            mediaProductType:
              typeof media.media_product_type === "string"
                ? media.media_product_type
                : null,
            mediaType:
              typeof media.media_type === "string" ? media.media_type : null,
            mediaUrl:
              typeof media.media_url === "string" ? media.media_url : null,
            thumbnailUrl:
              typeof media.thumbnail_url === "string" ? media.thumbnail_url : null,
            previewUrl:
              typeof media.preview_url === "string" ? media.preview_url : null,
            permalink:
              typeof media.permalink === "string" ? media.permalink : null,
            shortcode:
              typeof media.shortcode === "string" ? media.shortcode : null,
            postedAt: toDate(media.timestamp),
            username:
              typeof media.username === "string" ? media.username : null,
            isCommentEnabled:
              typeof media.is_comment_enabled === "boolean"
                ? media.is_comment_enabled
                : null,
            topComments: Array.isArray(media.top_comments) ? media.top_comments : null,
            insights:
              media.insights && typeof media.insights === "object"
                ? media.insights
                : null,
            warnings: Array.isArray(media.warnings) ? media.warnings : null,
            errors: Array.isArray(media.errors) ? media.errors : null,
            raw: media,
            syncedAt: now,
            updatedAt: now,
          },
        });
    }
  });
}

export async function getLatestInstagramSyncRun(userId: string) {
  return (
    await getDb()
      .select()
      .from(instagramSyncRuns)
      .where(eq(instagramSyncRuns.userId, userId))
      .orderBy(desc(instagramSyncRuns.startedAt))
      .limit(1)
  )[0] ?? null;
}
