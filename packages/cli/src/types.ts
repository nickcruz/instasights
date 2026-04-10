import type {
  AccountOverviewResponse,
  CleanResetResponse,
  LatestSnapshotResponse,
  MediaDetailResponse,
  MediaListResponse,
  SetupStatusResponse,
  SyncRunDetailResponse,
  SyncRunListResponse,
} from "@instagram-insights/contracts";

export type {
  AccountOverviewResponse,
  CleanResetResponse,
  LatestSnapshotResponse,
  MediaDetailResponse,
  MediaListResponse,
  SetupStatusResponse,
  SyncRunDetailResponse,
  SyncRunListResponse,
};

export type StoredAuthState = {
  appUrl: string;
  clientId: string | null;
  redirectUri: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
};

export type OAuthClientRegistration = {
  client_id: string;
  redirect_uris?: string[];
  token_endpoint_auth_method?: string;
  grant_types?: string[];
  response_types?: string[];
  scope?: string;
};

export type OAuthTokenResponse = {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  scope?: string;
  refresh_token?: string;
};

export type CliRootOptions = {
  appUrl?: string;
  json?: boolean;
  browser?: boolean;
};

export type SyncRunTriggerResponse =
  | {
      error: string;
      queuedNewRun: false;
      reusedExistingRun: false;
    }
  | {
      syncRun: Record<string, unknown>;
      reusedExistingRun: boolean;
      queuedNewRun: false;
      reason: string;
    }
  | {
      syncRunId: string;
      workflowRunId: string;
      status: "queued";
      queuedNewRun: true;
      reusedExistingRun: false;
      syncRun: Record<string, unknown> | null;
    };

export type InstalledVersionMetadata = {
  version: string;
  installedAt: string | null;
};

export type UpdateCheckCache = {
  checkedAt: string;
  localVersion: string | null;
  remoteVersion: string;
  updateAvailable: boolean;
  manifestUrl: string;
};

export type RemoteUpdateFile = {
  path: string;
  url: string;
  sha256: string;
};

export type RemoteUpdateManifest = {
  version: string;
  publishedAt: string;
  notes: string;
  files: RemoteUpdateFile[];
};

export type UpdateCheckStatus =
  | "disabled"
  | "cache"
  | "current"
  | "update-available"
  | "network-error"
  | "invalid-manifest";

export type UpdateCheckResult = {
  checkedAt: string;
  status: UpdateCheckStatus;
  manifestUrl: string | null;
  embeddedVersion: string;
  currentVersion: string;
  localVersion: string | null;
  remoteVersion: string | null;
  legacyInstall: boolean;
  updateAvailable: boolean;
  notes: string;
  fromCache: boolean;
  manifest: RemoteUpdateManifest | null;
  error: string | null;
};

export type UpdateApplyResult = {
  applied: boolean;
  previousVersion: string | null;
  currentVersion: string;
  manifestUrl: string | null;
  remoteVersion: string | null;
  legacyInstall: boolean;
  notes: string;
  reason?: string;
};
