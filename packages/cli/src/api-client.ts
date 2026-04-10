import {
  readAuthState,
  writeAuthState,
} from "./auth-store";
import { API_BEARER_SCOPE, DEFAULT_APP_URL } from "./constants";
import { fail } from "./output";
import { normalizeAppUrl, refreshAccessToken } from "./oauth";
import type {
  AccountOverviewResponse,
  CleanResetResponse,
  LatestSnapshotResponse,
  MediaDetailResponse,
  MediaListResponse,
  ReportResponse,
  StoredAuthState,
  SyncRunDetailResponse,
  SyncRunListResponse,
  SyncRunTriggerResponse,
} from "./types";

function isExpired(expiresAt: string | null) {
  if (!expiresAt) {
    return true;
  }

  return Date.now() >= new Date(expiresAt).getTime() - 30_000;
}

export class InstagramInsightsApiClient {
  private appUrl: string;

  constructor(appUrl = DEFAULT_APP_URL) {
    this.appUrl = normalizeAppUrl(appUrl);
  }

  async getAuthState() {
    const state = await readAuthState();
    return {
      ...state,
      appUrl: this.appUrl,
    } satisfies StoredAuthState;
  }

  private async refreshIfNeeded(state: StoredAuthState) {
    if (
      !state.clientId ||
      !state.refreshToken ||
      !state.accessToken ||
      !isExpired(state.expiresAt)
    ) {
      return state;
    }

    const tokens = await refreshAccessToken({
      appUrl: this.appUrl,
      clientId: state.clientId,
      refreshToken: state.refreshToken,
    });
    const nextState: StoredAuthState = {
      ...state,
      appUrl: this.appUrl,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? state.refreshToken,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    };

    await writeAuthState(nextState);

    return nextState;
  }

  private async requireAuthenticatedState() {
    const state = await this.refreshIfNeeded(await this.getAuthState());

    if (!state.accessToken) {
      fail("Authentication required. Run `instagram-insights auth login` first.", {
        appUrl: this.appUrl,
        scope: API_BEARER_SCOPE,
      });
    }

    return state;
  }

  async requestJson<T>(
    path: string,
    init?: RequestInit,
    allowRetry = true,
  ): Promise<T> {
    const state = await this.requireAuthenticatedState();
    const response = await fetch(`${this.appUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${state.accessToken}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (response.status === 401 && allowRetry && state.refreshToken && state.clientId) {
      const refreshed = await this.refreshIfNeeded({
        ...state,
        expiresAt: new Date(0).toISOString(),
      });

      return this.requestJson<T>(path, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          Authorization: `Bearer ${refreshed.accessToken}`,
        },
      }, false);
    }

    const payload = (await response.json().catch(() => null)) as
      | T
      | { error?: string; error_description?: string }
      | null;

    if (!response.ok) {
      fail("Instagram Insights API request failed.", {
        appUrl: this.appUrl,
        path,
        status: response.status,
        response: payload,
      });
    }

    return payload as T;
  }

  getAccountOverview() {
    return this.requestJson<AccountOverviewResponse>("/api/v1/account");
  }

  cleanReset() {
    return this.requestJson<CleanResetResponse>(
      "/api/v1/account/clean-reset",
      {
        method: "POST",
      },
    );
  }

  getLatestSnapshot() {
    return this.requestJson<LatestSnapshotResponse>("/api/v1/snapshot/latest");
  }

  listMedia(searchParams: URLSearchParams) {
    return this.requestJson<MediaListResponse>(`/api/v1/media?${searchParams.toString()}`);
  }

  getMedia(mediaId: string) {
    return this.requestJson<MediaDetailResponse>(`/api/v1/media/${encodeURIComponent(mediaId)}`);
  }

  getReport(days = 30) {
    return this.requestJson<ReportResponse>(
      `/api/v1/report?${new URLSearchParams({ days: String(days) }).toString()}`,
    );
  }

  listSyncRuns(searchParams: URLSearchParams) {
    return this.requestJson<SyncRunListResponse>(
      `/api/v1/sync-runs?${searchParams.toString()}`,
    );
  }

  getSyncRun(syncRunId: string) {
    return this.requestJson<SyncRunDetailResponse>(
      `/api/v1/sync-runs/${encodeURIComponent(syncRunId)}`,
    );
  }

  triggerSync(payload: { force?: boolean; staleAfterHours?: number }) {
    return this.requestJson<SyncRunTriggerResponse>(
      "/api/v1/sync-runs",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  }
}
