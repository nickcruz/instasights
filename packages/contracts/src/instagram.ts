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
  analysisReports: Record<string, PrecomputedAnalysisReport>;
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
  transcript?: string | null;
  hook?: string | null;
  theme?: string | null;
  hashtags?: string[];
  views?: number | null;
  reach?: number | null;
  likes?: number | null;
  saves?: number | null;
  shares?: number | null;
  comments?: number | null;
  engagementRate?: number | null;
  analysisVersion?: string | null;
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

export type PrecomputedAnalysisAccountSummary = {
  username: string | null;
  followers: number | null;
  following: number | null;
  bio: string | null;
  website: string | null;
  profilePictureUrl: string | null;
};

export type PrecomputedAnalysisPost = {
  id: string;
  postedAt: string | null;
  type: string | null;
  caption: string | null;
  transcript: string | null;
  hook: string | null;
  theme: string | null;
  hashtags: string[];
  views: number | null;
  reach: number | null;
  likes: number | null;
  saves: number | null;
  shares: number | null;
  comments: number | null;
  engagementRate: number | null;
  permalink: string | null;
  thumbnailUrl: string | null;
  analysisVersion: string;
};

export type PrecomputedThemeAverage = {
  theme: string;
  postCount: number;
  avgViews: number | null;
  avgReach: number | null;
  avgLikes: number | null;
  avgSaves: number | null;
  avgShares: number | null;
  avgComments: number | null;
  avgEngagementRate: number | null;
};

export type PrecomputedHashtagCount = {
  hashtag: string;
  count: number;
};

export type PrecomputedAnalysisReport = {
  generatedAt: string;
  analysisVersion: string;
  window: {
    since: string;
    until: string;
    days: number;
  };
  accountSummary: PrecomputedAnalysisAccountSummary;
  posts: PrecomputedAnalysisPost[];
  aggregates: {
    totals: {
      postCount: number;
      views: number;
      reach: number;
      likes: number;
      saves: number;
      shares: number;
      comments: number;
      avgEngagementRate: number | null;
    };
    themeAverages: PrecomputedThemeAverage[];
    topPostsByMetric: Record<string, PrecomputedAnalysisPost[]>;
    hashtags: PrecomputedHashtagCount[];
  };
};

export type ReportResponse = {
  status: ApiReadStatus;
  account: LinkedInstagramAccountSummary | null;
  latestSyncRun: InstagramSyncRunSummary | null;
  report: PrecomputedAnalysisReport | null;
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
