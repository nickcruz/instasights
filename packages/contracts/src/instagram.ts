export type ApiReadStatus = "not_linked" | "not_synced" | "ready";

export type CursorPage = {
  nextCursor: string | null;
};

export type SyncRunProgressState = {
  mediaCatalogCount?: number;
  recentMediaCount?: number;
  totalBundles?: number;
  completedBundles?: number;
  activeBundleLabel?: string | null;
  transcriptEligibleCount?: number;
  transcriptCompletedCount?: number;
  transcriptFailedCount?: number;
  activeTranscriptMediaId?: string | null;
} | null;

export type LinkedInstagramAccountSummary = {
  id: string;
  instagramUserId: string;
  username: string | null;
  graphApiVersion: string;
  linkedAt: string;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InstagramSyncRunSummary = {
  id: string;
  instagramAccountId: string;
  status: string;
  triggerType: string | null;
  workflowRunId: string | null;
  currentStep: string | null;
  progressPercent: number | null;
  statusMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  lastHeartbeatAt: string | null;
  durationSeconds: number | null;
  mediaCount: number | null;
  warningCount: number | null;
  error: string | null;
  progress: SyncRunProgressState;
  summary: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type AccountOverviewResponse = {
  status: ApiReadStatus;
  account: LinkedInstagramAccountSummary | null;
  latestSyncRun: InstagramSyncRunSummary | null;
};

export type CleanResetResponse = {
  status: "not_linked";
  account: null;
  latestSyncRun: null;
  reset: {
    hadLinkedAccount: boolean;
    deletedInstagramAccountId: string | null;
    deletedAccounts: number;
    deletedSyncRuns: number;
    deletedSnapshots: number;
    deletedMediaItems: number;
  };
};

export type LatestSnapshot = {
  syncRunId: string;
  instagramAccountId: string;
  createdAt: string;
  account: Record<string, unknown>;
  accountInsights: Record<string, unknown>;
  analysisFacts: Record<string, unknown>;
  highlights: Record<string, unknown>;
  warnings: unknown[];
  fetchManifest: Record<string, unknown>;
};

export type LatestSnapshotResponse = {
  status: ApiReadStatus;
  account: LinkedInstagramAccountSummary | null;
  latestSyncRun: InstagramSyncRunSummary | null;
  snapshot: LatestSnapshot | null;
};

export type InstagramMediaListItem = {
  id: string;
  instagramAccountId: string;
  lastSyncRunId: string | null;
  caption: string | null;
  commentsCount: number | null;
  likeCount: number | null;
  mediaProductType: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  permalink: string | null;
  shortcode: string | null;
  postedAt: string | null;
  username: string | null;
  isCommentEnabled: boolean | null;
  transcriptStatus: string | null;
  transcriptText: string | null;
  transcriptLanguage: string | null;
  transcriptModel: string | null;
  transcriptClipSeconds: number | null;
  transcriptError: string | null;
  transcriptMetadata: Record<string, unknown> | null;
  transcriptUpdatedAt: string | null;
  syncedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type InstagramMediaDetail = InstagramMediaListItem & {
  topComments: unknown[] | null;
  insights: Record<string, unknown> | null;
  warnings: unknown[] | null;
  errors: unknown[] | null;
  raw: Record<string, unknown> | null;
};

export type MediaListResponse = CursorPage & {
  items: InstagramMediaListItem[];
};

export type MediaDetailResponse = {
  media: InstagramMediaDetail | null;
};

export type SyncRunListResponse = CursorPage & {
  items: InstagramSyncRunSummary[];
};

export type InstagramSyncRunDetail = InstagramSyncRunSummary & {
  report: Record<string, unknown> | null;
};

export type SyncRunDetailResponse = {
  syncRun: InstagramSyncRunDetail | null;
};

export type DeveloperApiKeySummary = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DeveloperApiKeyCreateResponse = {
  apiKey: string;
  key: DeveloperApiKeySummary;
};

export type SetupStatus = "not_linked" | "not_synced" | "syncing" | "stale" | "ready";

export type SetupNextAction =
  | "connect_instagram"
  | "trigger_sync"
  | "wait_for_sync"
  | "analyze";

export type SetupStatusResponse = {
  status: SetupStatus;
  account: LinkedInstagramAccountSummary | null;
  latestSyncRun: InstagramSyncRunSummary | null;
  freshness: {
    staleAfterHours: number;
    isFresh: boolean;
    latestCompletedAt: string | null;
    ageHours: number | null;
    summary: string;
  };
  instagramLinkUrl: string;
  developersUrl: string;
  recommendedNextAction: SetupNextAction;
  recommendedPrompt: string;
};
