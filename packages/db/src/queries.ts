import type {
  AccountOverviewResponse,
  DeveloperApiKeySummary,
  InstagramMediaDetail,
  InstagramMediaListItem,
  PrecomputedAnalysisPost,
  PrecomputedAnalysisReport,
  ReportResponse,
  InstagramSyncRunDetail,
  InstagramSyncRunSummary,
  LatestSnapshotResponse,
  MediaDetailResponse,
  MediaListResponse,
  SyncRunDetailResponse,
  SyncRunListResponse,
} from "@instagram-insights/contracts";
import { and, desc, eq, gte, isNull, lte, ne, or, sql } from "drizzle-orm";

import { getDb } from "./client";
import {
  developerApiKeys,
  instagramAccountSnapshots,
  instagramAccounts,
  instagramMediaItems,
  instagramSyncRuns,
  mcpOAuthAccessTokens,
  mcpOAuthAuthorizationCodes,
  mcpOAuthClients,
  mcpOAuthRefreshTokens,
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

type SyncRunProgress = {
  mediaCatalogCount?: number;
  recentMediaCount?: number;
  totalBundles?: number;
  completedBundles?: number;
  activeBundleLabel?: string | null;
  transcriptEligibleCount?: number;
  transcriptCompletedCount?: number;
  transcriptFailedCount?: number;
  activeTranscriptMediaId?: string | null;
};

type TranscriptStatus = "processing" | "completed" | "failed";

type TranscriptSuccessInput = {
  mediaId: string;
  syncRunId: string;
  transcriptText: string;
  transcriptLanguage?: string | null;
  transcriptModel: string;
  transcriptClipSeconds: number;
  transcriptMetadata?: Record<string, unknown> | null;
};

type TranscriptFailureInput = {
  mediaId: string;
  syncRunId: string;
  error: string;
  transcriptModel?: string | null;
  transcriptClipSeconds?: number | null;
  transcriptMetadata?: Record<string, unknown> | null;
};

type PersistMediaAnalysisInput = {
  syncRunId: string;
  mediaId: string;
  analysis: PrecomputedAnalysisPost;
};

type PaginationCursor = {
  sortAt: string;
  id: string;
};

type RawSyncRun = typeof instagramSyncRuns.$inferSelect;
type RawInstagramAccount = typeof instagramAccounts.$inferSelect;
type RawMediaItem = typeof instagramMediaItems.$inferSelect;
type RawApiKey = typeof developerApiKeys.$inferSelect;
type RawMcpOAuthClient = typeof mcpOAuthClients.$inferSelect;
type RawMcpOAuthAccessToken = typeof mcpOAuthAccessTokens.$inferSelect;
type RawMcpOAuthRefreshToken = typeof mcpOAuthRefreshTokens.$inferSelect;

type McpOAuthClientInput = {
  clientId: string;
  clientSecretHash?: string | null;
  clientName?: string | null;
  redirectUris: string[];
  tokenEndpointAuthMethod: string;
  grantTypes: string[];
  responseTypes: string[];
  scope?: string | null;
  metadata?: Record<string, unknown> | null;
};

type McpOAuthAuthorizationCodeInput = {
  codeHash: string;
  clientDbId: string;
  userId: string;
  redirectUri: string;
  scope?: string | null;
  resource?: string | null;
  codeChallenge: string;
  codeChallengeMethod: string;
  expiresAt: Date;
};

type McpOAuthTokenInput = {
  tokenHash: string;
  clientDbId: string;
  userId: string;
  scope?: string | null;
  resource?: string | null;
  expiresAt: Date;
};

function toDate(value: unknown) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIsoString(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toRecord(value: unknown) {
  return isRecord(value) ? value : null;
}

function toArray(value: unknown) {
  return Array.isArray(value) ? value : null;
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function clampLimit(value: number | undefined, fallback = 25, max = 100) {
  if (!value || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(1, Math.min(value, max));
}

function encodeCursor(input: PaginationCursor) {
  return Buffer.from(JSON.stringify(input), "utf8").toString("base64url");
}

function decodeCursor(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as PaginationCursor;

    if (
      !parsed ||
      typeof parsed.sortAt !== "string" ||
      typeof parsed.id !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function serializeInstagramAccount(
  row: RawInstagramAccount,
) {
  return {
    id: row.id,
    instagramUserId: row.instagramUserId,
    username: row.username,
    graphApiVersion: row.graphApiVersion,
    linkedAt: row.linkedAt.toISOString(),
    lastSyncedAt: toIsoString(row.lastSyncedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeSyncRunSummary(
  row: RawSyncRun,
): InstagramSyncRunSummary {
  return {
    id: row.id,
    instagramAccountId: row.instagramAccountId,
    status: row.status,
    triggerType: row.triggerType ?? null,
    workflowRunId: row.workflowRunId ?? null,
    currentStep: row.currentStep ?? null,
    progressPercent: row.progressPercent ?? null,
    statusMessage: row.statusMessage ?? null,
    startedAt: row.startedAt.toISOString(),
    completedAt: toIsoString(row.completedAt),
    lastHeartbeatAt: toIsoString(row.lastHeartbeatAt),
    durationSeconds: row.durationSeconds ?? null,
    mediaCount: row.mediaCount ?? null,
    warningCount: row.warningCount ?? null,
    error: row.error ?? null,
    progress:
      row.progress && isRecord(row.progress)
        ? (row.progress as InstagramSyncRunSummary["progress"])
        : null,
    summary: toRecord(row.summary),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeMediaListItem(
  row: RawMediaItem,
): InstagramMediaListItem {
  const analysis = toRecord(row.analysis);

  return {
    id: row.instagramMediaId,
    instagramAccountId: row.instagramAccountId,
    lastSyncRunId: row.lastSyncRunId ?? null,
    caption: row.caption ?? null,
    commentsCount: row.commentsCount ?? null,
    likeCount: row.likeCount ?? null,
    mediaProductType: row.mediaProductType ?? null,
    mediaType: row.mediaType ?? null,
    mediaUrl: row.mediaUrl ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
    previewUrl: row.previewUrl ?? null,
    permalink: row.permalink ?? null,
    shortcode: row.shortcode ?? null,
    postedAt: toIsoString(row.postedAt),
    username: row.username ?? null,
    isCommentEnabled: row.isCommentEnabled ?? null,
    transcriptStatus: row.transcriptStatus ?? null,
    transcriptText: row.transcriptText ?? null,
    transcriptLanguage: row.transcriptLanguage ?? null,
    transcriptModel: row.transcriptModel ?? null,
    transcriptClipSeconds: row.transcriptClipSeconds ?? null,
    transcriptError: row.transcriptError ?? null,
    transcriptMetadata: toRecord(row.transcriptMetadata),
    transcriptUpdatedAt: toIsoString(row.transcriptUpdatedAt),
    transcript: typeof analysis?.transcript === "string" ? analysis.transcript : null,
    hook: typeof analysis?.hook === "string" ? analysis.hook : null,
    theme: typeof analysis?.theme === "string" ? analysis.theme : null,
    hashtags: toStringArray(analysis?.hashtags),
    views: typeof analysis?.views === "number" ? analysis.views : null,
    reach: typeof analysis?.reach === "number" ? analysis.reach : null,
    likes: typeof analysis?.likes === "number" ? analysis.likes : null,
    saves: typeof analysis?.saves === "number" ? analysis.saves : null,
    shares: typeof analysis?.shares === "number" ? analysis.shares : null,
    comments: typeof analysis?.comments === "number" ? analysis.comments : null,
    engagementRate:
      typeof analysis?.engagementRate === "number" ? analysis.engagementRate : null,
    analysisVersion:
      typeof analysis?.analysisVersion === "string"
        ? analysis.analysisVersion
        : null,
    syncedAt: row.syncedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeMediaDetail(
  row: RawMediaItem,
): InstagramMediaDetail {
  return {
    ...serializeMediaListItem(row),
    topComments: toArray(row.topComments),
    insights: toRecord(row.insights),
    warnings: toArray(row.warnings),
    errors: toArray(row.errors),
    raw: toRecord(row.raw),
  };
}

function stripFlatMetrics(
  item: InstagramMediaListItem,
): InstagramMediaListItem {
  const {
    transcript,
    hook,
    theme,
    hashtags,
    views,
    reach,
    likes,
    saves,
    shares,
    comments,
    engagementRate,
    analysisVersion,
    ...rest
  } = item;

  void transcript;
  void hook;
  void theme;
  void hashtags;
  void views;
  void reach;
  void likes;
  void saves;
  void shares;
  void comments;
  void engagementRate;
  void analysisVersion;

  return rest;
}

function serializeApiKey(
  row: RawApiKey,
): DeveloperApiKeySummary {
  return {
    id: row.id,
    name: row.name,
    keyPrefix: row.keyPrefix,
    lastUsedAt: toIsoString(row.lastUsedAt),
    expiresAt: toIsoString(row.expiresAt),
    revokedAt: toIsoString(row.revokedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeMcpOAuthClient(
  row: RawMcpOAuthClient,
) {
  return {
    id: row.id,
    clientId: row.clientId,
    clientSecretHash: row.clientSecretHash ?? null,
    clientName: row.clientName ?? null,
    redirectUris: toStringArray(row.redirectUris),
    tokenEndpointAuthMethod: row.tokenEndpointAuthMethod,
    grantTypes: toStringArray(row.grantTypes),
    responseTypes: toStringArray(row.responseTypes),
    scope: row.scope ?? null,
    metadata: toRecord(row.metadata),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const mediaSortAtExpression =
  sql<Date>`coalesce(${instagramMediaItems.postedAt}, ${instagramMediaItems.syncedAt}, ${instagramMediaItems.createdAt})`;

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

export async function createDeveloperApiKey(input: {
  userId: string;
  name: string;
  keyPrefix: string;
  secretHash: string;
  expiresAt?: Date | null;
}) {
  return (
    await getDb()
      .insert(developerApiKeys)
      .values({
        userId: input.userId,
        name: input.name,
        keyPrefix: input.keyPrefix,
        secretHash: input.secretHash,
        expiresAt: input.expiresAt ?? null,
        updatedAt: new Date(),
      })
      .returning()
  )[0];
}

export async function listDeveloperApiKeysByUserId(userId: string) {
  return await getDb()
    .select()
    .from(developerApiKeys)
    .where(eq(developerApiKeys.userId, userId))
    .orderBy(desc(developerApiKeys.createdAt));
}

export async function getDeveloperApiKeyByPrefix(keyPrefix: string) {
  return (
    await getDb()
      .select()
      .from(developerApiKeys)
      .where(eq(developerApiKeys.keyPrefix, keyPrefix))
      .limit(1)
  )[0] ?? null;
}

export async function touchDeveloperApiKeyLastUsed(keyId: string) {
  return (
    await getDb()
      .update(developerApiKeys)
      .set({
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(developerApiKeys.id, keyId))
      .returning()
  )[0] ?? null;
}

export async function revokeDeveloperApiKey(input: {
  keyId: string;
  userId: string;
}) {
  return (
    await getDb()
      .update(developerApiKeys)
      .set({
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(developerApiKeys.id, input.keyId),
          eq(developerApiKeys.userId, input.userId),
        ),
      )
      .returning()
  )[0] ?? null;
}

export async function createMcpOAuthClient(input: McpOAuthClientInput) {
  return (
    await getDb()
      .insert(mcpOAuthClients)
      .values({
        clientId: input.clientId,
        clientSecretHash: input.clientSecretHash ?? null,
        clientName: input.clientName ?? null,
        redirectUris: input.redirectUris,
        tokenEndpointAuthMethod: input.tokenEndpointAuthMethod,
        grantTypes: input.grantTypes,
        responseTypes: input.responseTypes,
        scope: input.scope ?? null,
        metadata: input.metadata ?? null,
        updatedAt: new Date(),
      })
      .returning()
  )[0];
}

export async function getMcpOAuthClientByClientId(clientId: string) {
  const row =
    (
      await getDb()
        .select()
        .from(mcpOAuthClients)
        .where(eq(mcpOAuthClients.clientId, clientId))
        .limit(1)
    )[0] ?? null;

  return row ? serializeMcpOAuthClient(row) : null;
}

export async function createMcpOAuthAuthorizationCode(
  input: McpOAuthAuthorizationCodeInput,
) {
  return (
    await getDb()
      .insert(mcpOAuthAuthorizationCodes)
      .values({
        codeHash: input.codeHash,
        clientId: input.clientDbId,
        userId: input.userId,
        redirectUri: input.redirectUri,
        scope: input.scope ?? null,
        resource: input.resource ?? null,
        codeChallenge: input.codeChallenge,
        codeChallengeMethod: input.codeChallengeMethod,
        expiresAt: input.expiresAt,
      })
      .returning()
  )[0];
}

export async function consumeMcpOAuthAuthorizationCode(codeHash: string) {
  const db = getDb();
  const now = new Date();
  const row =
    (
      await db
        .select({
          code: mcpOAuthAuthorizationCodes,
          client: mcpOAuthClients,
        })
        .from(mcpOAuthAuthorizationCodes)
        .innerJoin(
          mcpOAuthClients,
          eq(mcpOAuthAuthorizationCodes.clientId, mcpOAuthClients.id),
        )
        .where(eq(mcpOAuthAuthorizationCodes.codeHash, codeHash))
        .limit(1)
    )[0] ?? null;

  if (!row) {
    return null;
  }

  const { code, client } = row;

  if (code.consumedAt || code.expiresAt.getTime() <= now.getTime()) {
    return null;
  }

  await db
    .update(mcpOAuthAuthorizationCodes)
    .set({
      consumedAt: now,
    })
    .where(eq(mcpOAuthAuthorizationCodes.id, code.id));

  return {
    code,
    client: serializeMcpOAuthClient(client),
  };
}

export async function createMcpOAuthAccessToken(input: McpOAuthTokenInput) {
  return (
    await getDb()
      .insert(mcpOAuthAccessTokens)
      .values({
        tokenHash: input.tokenHash,
        clientId: input.clientDbId,
        userId: input.userId,
        scope: input.scope ?? null,
        resource: input.resource ?? null,
        expiresAt: input.expiresAt,
        updatedAt: new Date(),
      })
      .returning()
  )[0];
}

export async function createMcpOAuthRefreshToken(input: McpOAuthTokenInput) {
  return (
    await getDb()
      .insert(mcpOAuthRefreshTokens)
      .values({
        tokenHash: input.tokenHash,
        clientId: input.clientDbId,
        userId: input.userId,
        scope: input.scope ?? null,
        resource: input.resource ?? null,
        expiresAt: input.expiresAt,
        updatedAt: new Date(),
      })
      .returning()
  )[0];
}

export async function getMcpOAuthAccessTokenByHash(tokenHash: string) {
  return (
    await getDb()
      .select({
        token: mcpOAuthAccessTokens,
        client: mcpOAuthClients,
      })
      .from(mcpOAuthAccessTokens)
      .innerJoin(mcpOAuthClients, eq(mcpOAuthAccessTokens.clientId, mcpOAuthClients.id))
      .where(eq(mcpOAuthAccessTokens.tokenHash, tokenHash))
      .limit(1)
  )[0] ?? null;
}

export async function getMcpOAuthRefreshTokenByHash(tokenHash: string) {
  return (
    await getDb()
      .select({
        token: mcpOAuthRefreshTokens,
        client: mcpOAuthClients,
      })
      .from(mcpOAuthRefreshTokens)
      .innerJoin(mcpOAuthClients, eq(mcpOAuthRefreshTokens.clientId, mcpOAuthClients.id))
      .where(eq(mcpOAuthRefreshTokens.tokenHash, tokenHash))
      .limit(1)
  )[0] ?? null;
}

export async function touchMcpOAuthAccessTokenLastUsed(tokenId: string) {
  return (
    await getDb()
      .update(mcpOAuthAccessTokens)
      .set({
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(mcpOAuthAccessTokens.id, tokenId))
      .returning()
  )[0] ?? null;
}

export async function revokeMcpOAuthRefreshToken(input: {
  tokenId: string;
  replacedByTokenId?: string | null;
}) {
  return (
    await getDb()
      .update(mcpOAuthRefreshTokens)
      .set({
        revokedAt: new Date(),
        replacedByTokenId: input.replacedByTokenId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(mcpOAuthRefreshTokens.id, input.tokenId))
      .returning()
  )[0] ?? null;
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
        progress: {
          mediaCatalogCount: 0,
          recentMediaCount: 0,
          totalBundles: 0,
          completedBundles: 0,
          activeBundleLabel: null,
          transcriptEligibleCount: 0,
          transcriptCompletedCount: 0,
          transcriptFailedCount: 0,
          activeTranscriptMediaId: null,
        },
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
  progress?: SyncRunProgress | null;
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
        progress: input.progress,
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
  progress?: SyncRunProgress | null;
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
        progress: input.progress,
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
        currentStep: "persist",
        statusMessage: "Sync data persisted",
        lastHeartbeatAt: now,
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
        analysisReports: null,
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
          analysisReports: null,
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
          instagramMediaId: mediaId,
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
          target: [
            instagramMediaItems.instagramAccountId,
            instagramMediaItems.instagramMediaId,
          ],
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

export async function markInstagramSyncRunCompleted(input: {
  runId: string;
  statusMessage?: string | null;
}) {
  const now = new Date();

  return (
    await getDb()
      .update(instagramSyncRuns)
      .set({
        status: "completed",
        currentStep: "complete",
        progressPercent: 100,
        statusMessage: input.statusMessage ?? "Sync completed",
        progress: null,
        lastHeartbeatAt: now,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(instagramSyncRuns.id, input.runId))
      .returning()
  )[0] ?? null;
}

export async function listInstagramMediaItemsForTranscription(input: {
  syncRunId: string;
  userId: string;
}) {
  return await getDb()
    .select({
      id: instagramMediaItems.instagramMediaId,
      mediaType: instagramMediaItems.mediaType,
      mediaUrl: instagramMediaItems.mediaUrl,
      transcriptStatus: instagramMediaItems.transcriptStatus,
    })
    .from(instagramMediaItems)
    .where(
      and(
        eq(instagramMediaItems.userId, input.userId),
        eq(instagramMediaItems.lastSyncRunId, input.syncRunId),
        eq(instagramMediaItems.mediaType, "VIDEO"),
        or(
          isNull(instagramMediaItems.transcriptStatus),
          ne(instagramMediaItems.transcriptStatus, "completed"),
        ),
      ),
    )
    .orderBy(
      desc(instagramMediaItems.postedAt),
      desc(instagramMediaItems.instagramMediaId),
    );
}

async function updateInstagramMediaTranscriptStatus(input: {
  mediaId: string;
  syncRunId: string;
  transcriptStatus: TranscriptStatus;
  transcriptText?: string | null;
  transcriptLanguage?: string | null;
  transcriptModel?: string | null;
  transcriptClipSeconds?: number | null;
  transcriptError?: string | null;
  transcriptMetadata?: Record<string, unknown> | null;
}) {
  return (
    await getDb()
      .update(instagramMediaItems)
      .set({
        transcriptStatus: input.transcriptStatus,
        transcriptText: input.transcriptText ?? null,
        transcriptLanguage: input.transcriptLanguage ?? null,
        transcriptModel: input.transcriptModel ?? null,
        transcriptClipSeconds: input.transcriptClipSeconds ?? null,
        transcriptError: input.transcriptError ?? null,
        transcriptMetadata: input.transcriptMetadata ?? null,
        transcriptUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(instagramMediaItems.instagramMediaId, input.mediaId),
          eq(instagramMediaItems.lastSyncRunId, input.syncRunId),
        ),
      )
      .returning()
  )[0] ?? null;
}

export async function markInstagramMediaItemTranscriptionStarted(input: {
  mediaId: string;
  syncRunId: string;
}) {
  return updateInstagramMediaTranscriptStatus({
    mediaId: input.mediaId,
    syncRunId: input.syncRunId,
    transcriptStatus: "processing",
    transcriptError: null,
  });
}

export async function persistInstagramMediaItemTranscriptionSuccess(
  input: TranscriptSuccessInput,
) {
  return updateInstagramMediaTranscriptStatus({
    mediaId: input.mediaId,
    syncRunId: input.syncRunId,
    transcriptStatus: "completed",
    transcriptText: input.transcriptText,
    transcriptLanguage: input.transcriptLanguage ?? null,
    transcriptModel: input.transcriptModel,
    transcriptClipSeconds: input.transcriptClipSeconds,
    transcriptError: null,
    transcriptMetadata: input.transcriptMetadata ?? null,
  });
}

export async function persistInstagramMediaItemTranscriptionFailure(
  input: TranscriptFailureInput,
) {
  return updateInstagramMediaTranscriptStatus({
    mediaId: input.mediaId,
    syncRunId: input.syncRunId,
    transcriptStatus: "failed",
    transcriptText: null,
    transcriptLanguage: null,
    transcriptModel: input.transcriptModel ?? null,
    transcriptClipSeconds: input.transcriptClipSeconds ?? null,
    transcriptError: input.error,
    transcriptMetadata: input.transcriptMetadata ?? null,
  });
}

export async function getLatestInstagramSyncRun(userId: string) {
  return (
    await getDb()
      .select()
      .from(instagramSyncRuns)
      .where(eq(instagramSyncRuns.userId, userId))
      .orderBy(desc(instagramSyncRuns.startedAt), desc(instagramSyncRuns.id))
      .limit(1)
  )[0] ?? null;
}

export async function getLatestActiveInstagramSyncRunByUserId(userId: string) {
  const rows = await getDb()
    .select()
    .from(instagramSyncRuns)
    .where(eq(instagramSyncRuns.userId, userId))
    .orderBy(desc(instagramSyncRuns.startedAt), desc(instagramSyncRuns.id))
    .limit(10);

  return rows.find((row) => row.status === "queued" || row.status === "running") ?? null;
}

export async function getAccountOverviewByUserId(
  userId: string,
): Promise<AccountOverviewResponse> {
  const [account, latestSyncRun] = await Promise.all([
    getInstagramAccountByUserId(userId),
    getLatestInstagramSyncRun(userId),
  ]);

  if (!account) {
    return {
      status: "not_linked",
      account: null,
      latestSyncRun: null,
    };
  }

  return {
    status: account.lastSyncedAt ? "ready" : "not_synced",
    account: serializeInstagramAccount(account),
    latestSyncRun: latestSyncRun ? serializeSyncRunSummary(latestSyncRun) : null,
  };
}

export async function cleanResetInstagramStateByUserId(userId: string) {
  const db = getDb();

  return await db.transaction(async (tx) => {
    const linkedAccount =
      (
        await tx
          .select()
          .from(instagramAccounts)
          .where(eq(instagramAccounts.userId, userId))
          .limit(1)
      )[0] ?? null;

    const mediaCountRow =
      (
        await tx
          .select({
            count: sql<number>`count(*)::int`,
          })
          .from(instagramMediaItems)
          .where(eq(instagramMediaItems.userId, userId))
      )[0] ?? { count: 0 };

    const syncRunCountRow =
      (
        await tx
          .select({
            count: sql<number>`count(*)::int`,
          })
          .from(instagramSyncRuns)
          .where(eq(instagramSyncRuns.userId, userId))
      )[0] ?? { count: 0 };

    const snapshotCountRow =
      (
        await tx
          .select({
            count: sql<number>`count(*)::int`,
          })
          .from(instagramAccountSnapshots)
          .innerJoin(
            instagramSyncRuns,
            eq(instagramSyncRuns.id, instagramAccountSnapshots.syncRunId),
          )
          .where(eq(instagramSyncRuns.userId, userId))
      )[0] ?? { count: 0 };

    const deletedMediaItems = await tx
      .delete(instagramMediaItems)
      .where(eq(instagramMediaItems.userId, userId))
      .returning({ rowId: instagramMediaItems.rowId });

    const deletedSyncRuns = await tx
      .delete(instagramSyncRuns)
      .where(eq(instagramSyncRuns.userId, userId))
      .returning({ id: instagramSyncRuns.id });

    const deletedAccounts = await tx
      .delete(instagramAccounts)
      .where(eq(instagramAccounts.userId, userId))
      .returning({ id: instagramAccounts.id });

    return {
      status: "not_linked" as const,
      account: null,
      latestSyncRun: null,
      reset: {
        hadLinkedAccount: linkedAccount !== null,
        deletedInstagramAccountId:
          linkedAccount?.id ?? deletedAccounts[0]?.id ?? null,
        deletedAccounts: deletedAccounts.length,
        deletedSyncRuns: deletedSyncRuns.length || syncRunCountRow.count,
        deletedSnapshots: snapshotCountRow.count,
        deletedMediaItems: deletedMediaItems.length || mediaCountRow.count,
      },
    };
  });
}

export async function getLatestSnapshotByUserId(
  userId: string,
): Promise<LatestSnapshotResponse> {
  const account = await getInstagramAccountByUserId(userId);

  if (!account) {
    return {
      status: "not_linked",
      account: null,
      latestSyncRun: null,
      snapshot: null,
    };
  }

  const snapshotRow = (
    await getDb()
      .select({
        snapshot: instagramAccountSnapshots,
        syncRun: instagramSyncRuns,
      })
      .from(instagramAccountSnapshots)
      .innerJoin(
        instagramSyncRuns,
        eq(instagramSyncRuns.id, instagramAccountSnapshots.syncRunId),
      )
      .where(eq(instagramSyncRuns.userId, userId))
      .orderBy(
        desc(instagramAccountSnapshots.createdAt),
        desc(instagramAccountSnapshots.syncRunId),
      )
      .limit(1)
  )[0] ?? null;

  if (!snapshotRow) {
    return {
      status: "not_synced",
      account: serializeInstagramAccount(account),
      latestSyncRun: null,
      snapshot: null,
    };
  }

  return {
    status: "ready",
    account: serializeInstagramAccount(account),
    latestSyncRun: serializeSyncRunSummary(snapshotRow.syncRun),
    snapshot: {
      syncRunId: snapshotRow.snapshot.syncRunId,
      instagramAccountId: snapshotRow.snapshot.instagramAccountId,
      createdAt: snapshotRow.snapshot.createdAt.toISOString(),
      account: toRecord(snapshotRow.snapshot.account) ?? {},
      accountInsights: toRecord(snapshotRow.snapshot.accountInsights) ?? {},
      analysisFacts: toRecord(snapshotRow.snapshot.analysisFacts) ?? {},
      highlights: toRecord(snapshotRow.snapshot.highlights) ?? {},
      analysisReports:
        ((toRecord(snapshotRow.snapshot.analysisReports) ?? {}) as Record<
          string,
          PrecomputedAnalysisReport
        >),
      warnings: toArray(snapshotRow.snapshot.warnings) ?? [],
      fetchManifest: toRecord(snapshotRow.snapshot.fetchManifest) ?? {},
    },
  };
}

export async function listInstagramMediaByUserId(input: {
  userId: string;
  limit?: number;
  cursor?: string | null;
  mediaType?: string | null;
  since?: string | null;
  until?: string | null;
  includeFlatMetrics?: boolean;
}): Promise<MediaListResponse> {
  const limit = clampLimit(input.limit);
  const cursor = decodeCursor(input.cursor);
  const since = toDate(input.since);
  const until = toDate(input.until);

  const conditions = [eq(instagramMediaItems.userId, input.userId)];

  if (input.mediaType) {
    conditions.push(eq(instagramMediaItems.mediaType, input.mediaType));
  }

  if (since) {
    conditions.push(gte(mediaSortAtExpression, since));
  }

  if (until) {
    conditions.push(lte(mediaSortAtExpression, until));
  }

  if (cursor) {
    const cursorDate = toDate(cursor.sortAt);

    if (cursorDate) {
      conditions.push(
        sql`(${mediaSortAtExpression} < ${cursorDate} OR (${mediaSortAtExpression} = ${cursorDate} AND ${instagramMediaItems.instagramMediaId} < ${cursor.id}))`,
      );
    }
  }

  const rows = await getDb()
    .select({
      media: instagramMediaItems,
      sortAt: mediaSortAtExpression,
    })
    .from(instagramMediaItems)
    .where(and(...conditions))
    .orderBy(
      desc(mediaSortAtExpression),
      desc(instagramMediaItems.instagramMediaId),
    )
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const lastRow = pageRows.at(-1);

  return {
    items: pageRows.map(({ media }) => {
      const item = serializeMediaListItem(media);
      return input.includeFlatMetrics ? item : stripFlatMetrics(item);
    }),
    nextCursor: (() => {
      if (!hasMore || !lastRow) {
        return null;
      }

      const cursorSortAt = toDate(lastRow.sortAt);
      if (!cursorSortAt) {
        return null;
      }

      return encodeCursor({
        sortAt: cursorSortAt.toISOString(),
        id: lastRow.media.instagramMediaId,
      });
    })(),
  };
}

export async function getInstagramMediaDetailById(input: {
  mediaId: string;
  userId: string;
}): Promise<MediaDetailResponse> {
  const media =
    (
      await getDb()
        .select()
        .from(instagramMediaItems)
        .where(
          and(
            eq(instagramMediaItems.instagramMediaId, input.mediaId),
            eq(instagramMediaItems.userId, input.userId),
          ),
        )
        .limit(1)
    )[0] ?? null;

  return {
    media: media ? serializeMediaDetail(media) : null,
  };
}

export async function listInstagramMediaBySyncRunId(input: {
  syncRunId: string;
  userId: string;
}) {
  const rows = await getDb()
    .select()
    .from(instagramMediaItems)
    .where(
      and(
        eq(instagramMediaItems.lastSyncRunId, input.syncRunId),
        eq(instagramMediaItems.userId, input.userId),
      ),
    )
    .orderBy(
      desc(mediaSortAtExpression),
      desc(instagramMediaItems.instagramMediaId),
    );

  return rows.map(serializeMediaDetail);
}

export async function persistInstagramMediaAnalysis(
  input: PersistMediaAnalysisInput,
) {
  return (
    await getDb()
      .update(instagramMediaItems)
      .set({
        analysis: input.analysis,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(instagramMediaItems.lastSyncRunId, input.syncRunId),
          eq(instagramMediaItems.instagramMediaId, input.mediaId),
        ),
      )
      .returning()
  )[0] ?? null;
}

export async function persistInstagramSnapshotAnalysisReport(input: {
  syncRunId: string;
  reportKey: string;
  report: PrecomputedAnalysisReport;
}) {
  const snapshot =
    (
      await getDb()
        .select()
        .from(instagramAccountSnapshots)
        .where(eq(instagramAccountSnapshots.syncRunId, input.syncRunId))
        .limit(1)
    )[0] ?? null;

  if (!snapshot) {
    return null;
  }

  const currentReports = toRecord(snapshot.analysisReports) ?? {};
  const nextReports = {
    ...currentReports,
    [input.reportKey]: input.report,
  };

  return (
    await getDb()
      .update(instagramAccountSnapshots)
      .set({
        analysisReports: nextReports,
      })
      .where(eq(instagramAccountSnapshots.syncRunId, input.syncRunId))
      .returning()
  )[0] ?? null;
}

export async function getLatestAnalysisReportByUserId(input: {
  userId: string;
  reportKey: string;
}): Promise<ReportResponse> {
  const account = await getInstagramAccountByUserId(input.userId);

  if (!account) {
    return {
      status: "not_linked",
      account: null,
      latestSyncRun: null,
      report: null,
    };
  }

  const snapshotRow = (
    await getDb()
      .select({
        snapshot: instagramAccountSnapshots,
        syncRun: instagramSyncRuns,
      })
      .from(instagramAccountSnapshots)
      .innerJoin(
        instagramSyncRuns,
        eq(instagramSyncRuns.id, instagramAccountSnapshots.syncRunId),
      )
      .where(eq(instagramSyncRuns.userId, input.userId))
      .orderBy(
        desc(instagramAccountSnapshots.createdAt),
        desc(instagramAccountSnapshots.syncRunId),
      )
      .limit(1)
  )[0] ?? null;

  if (!snapshotRow) {
    return {
      status: "not_synced",
      account: serializeInstagramAccount(account),
      latestSyncRun: null,
      report: null,
    };
  }

  const analysisReports = toRecord(snapshotRow.snapshot.analysisReports) ?? {};
  const report = toRecord(analysisReports[input.reportKey]) as
    | PrecomputedAnalysisReport
    | null;

  return {
    status: report ? "ready" : "not_synced",
    account: serializeInstagramAccount(account),
    latestSyncRun: serializeSyncRunSummary(snapshotRow.syncRun),
    report,
  };
}

export async function listInstagramSyncRunsByUserId(input: {
  userId: string;
  limit?: number;
  cursor?: string | null;
}): Promise<SyncRunListResponse> {
  const limit = clampLimit(input.limit);
  const cursor = decodeCursor(input.cursor);
  const conditions = [eq(instagramSyncRuns.userId, input.userId)];

  if (cursor) {
    const cursorDate = toDate(cursor.sortAt);

    if (cursorDate) {
      conditions.push(
        sql`(${instagramSyncRuns.startedAt} < ${cursorDate} OR (${instagramSyncRuns.startedAt} = ${cursorDate} AND ${instagramSyncRuns.id} < ${cursor.id}))`,
      );
    }
  }

  const rows = await getDb()
    .select()
    .from(instagramSyncRuns)
    .where(and(...conditions))
    .orderBy(desc(instagramSyncRuns.startedAt), desc(instagramSyncRuns.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const lastRow = pageRows.at(-1);

  return {
    items: pageRows.map(serializeSyncRunSummary),
    nextCursor:
      hasMore && lastRow
        ? encodeCursor({
            sortAt: lastRow.startedAt.toISOString(),
            id: lastRow.id,
          })
        : null,
  };
}

export async function getInstagramSyncRunDetailById(input: {
  syncRunId: string;
  userId: string;
}): Promise<SyncRunDetailResponse> {
  const syncRun = await getInstagramSyncRunById({
    runId: input.syncRunId,
    userId: input.userId,
  });

  if (!syncRun) {
    return {
      syncRun: null,
    };
  }

  return {
    syncRun: {
      ...serializeSyncRunSummary(syncRun),
      report: toRecord(syncRun.report),
    } satisfies InstagramSyncRunDetail,
  };
}

export async function listDeveloperApiKeySummariesByUserId(userId: string) {
  const rows = await listDeveloperApiKeysByUserId(userId);
  return rows.map(serializeApiKey);
}
