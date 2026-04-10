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
