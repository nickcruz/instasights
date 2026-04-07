import { getEnv } from "@/lib/env";
import type { InstagramLink } from "@/lib/instagram-link";

const DEFAULT_API_VERSION = "v25.0";
const DEFAULT_BASE_URL = "https://graph.instagram.com";

const ACCOUNT_PROFILE_FIELD_CANDIDATES = [
  [
    "user_id",
    "id",
    "username",
    "name",
    "biography",
    "website",
    "followers_count",
    "follows_count",
    "media_count",
    "profile_picture_url",
  ],
  ["user_id", "id", "username", "name", "biography", "website", "media_count"],
  ["user_id", "id", "username"],
];

const MEDIA_DETAIL_FIELD_CANDIDATES = [
  [
    "id",
    "caption",
    "comments_count",
    "is_comment_enabled",
    "like_count",
    "media_product_type",
    "media_type",
    "media_url",
    "owner",
    "permalink",
    "shortcode",
    "thumbnail_url",
    "timestamp",
    "username",
    "children{media_product_type,media_type,media_url,permalink,thumbnail_url,timestamp,username}",
  ],
  [
    "id",
    "caption",
    "comments_count",
    "like_count",
    "media_product_type",
    "media_type",
    "media_url",
    "permalink",
    "thumbnail_url",
    "timestamp",
    "username",
  ],
  ["id", "media_product_type", "media_type", "permalink", "timestamp"],
];

const MEDIA_LIST_FIELD_CANDIDATES = [
  [
    "id",
    "caption",
    "comments_count",
    "like_count",
    "media_product_type",
    "media_type",
    "media_url",
    "permalink",
    "thumbnail_url",
    "timestamp",
    "username",
  ],
  ["id", "media_product_type", "media_type", "permalink", "timestamp"],
  ["id"],
];

const ACCOUNT_TOTAL_METRICS = [
  { metric: "accounts_engaged", period: "day", metric_type: "total_value" },
  {
    metric: "comments",
    period: "day",
    metric_type: "total_value",
    breakdown: "media_product_type",
  },
  {
    metric: "follows_and_unfollows",
    period: "day",
    metric_type: "total_value",
    breakdown: "follow_type",
  },
  {
    metric: "likes",
    period: "day",
    metric_type: "total_value",
    breakdown: "media_product_type",
  },
  {
    metric: "profile_links_taps",
    period: "day",
    metric_type: "total_value",
    breakdown: "contact_button_type",
  },
  { metric: "reach", period: "day", metric_type: "total_value" },
  { metric: "replies", period: "day", metric_type: "total_value" },
  { metric: "reposts", period: "day", metric_type: "total_value" },
  {
    metric: "saves",
    period: "day",
    metric_type: "total_value",
    breakdown: "media_product_type",
  },
  {
    metric: "shares",
    period: "day",
    metric_type: "total_value",
    breakdown: "media_product_type",
  },
  {
    metric: "total_interactions",
    period: "day",
    metric_type: "total_value",
    breakdown: "media_product_type",
  },
  {
    metric: "views",
    period: "day",
    metric_type: "total_value",
    breakdown: "media_product_type",
  },
];

const ACCOUNT_TIME_SERIES_METRICS = [
  { metric: "reach", period: "day", metric_type: "time_series" },
  { metric: "impressions", period: "day", metric_type: "time_series" },
];

const ACCOUNT_DEMOGRAPHIC_REQUESTS = [
  {
    metric: "engaged_audience_demographics",
    period: "lifetime",
    metric_type: "total_value",
    timeframe: "this_month",
    breakdown: "age,city,country,gender",
  },
  {
    metric: "follower_demographics",
    period: "lifetime",
    metric_type: "total_value",
    timeframe: "this_month",
    breakdown: "age,city,country,gender",
  },
];

const MEDIA_METRIC_REQUESTS: Record<string, Array<Record<string, string>>> = {
  FEED: [
    { metric: "comments" },
    { metric: "likes" },
    { metric: "reach" },
    { metric: "saved" },
    { metric: "shares" },
    { metric: "total_interactions" },
    { metric: "views" },
    { metric: "profile_activity", breakdown: "action_type" },
  ],
  REELS: [
    { metric: "comments" },
    { metric: "likes" },
    { metric: "reach" },
    { metric: "saved" },
    { metric: "shares" },
    { metric: "total_interactions" },
    { metric: "views" },
    { metric: "ig_reels_avg_watch_time" },
    { metric: "ig_reels_video_view_total_time" },
  ],
  STORY: [
    { metric: "reach" },
    { metric: "replies" },
    { metric: "shares" },
    { metric: "total_interactions" },
    { metric: "views" },
    { metric: "profile_activity", breakdown: "action_type" },
    { metric: "profile_visits" },
    { metric: "navigation", breakdown: "story_navigation_action_type" },
  ],
};

const COMMENT_FIELD_CANDIDATES = [
  ["id", "text", "timestamp", "username", "like_count", "replies_count"],
  ["id", "text", "timestamp", "username"],
  ["id", "text"],
];

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "because",
  "but",
  "by",
  "for",
  "from",
  "had",
  "has",
  "have",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "just",
  "like",
  "my",
  "of",
  "on",
  "or",
  "our",
  "so",
  "that",
  "the",
  "their",
  "them",
  "they",
  "this",
  "to",
  "too",
  "was",
  "we",
  "were",
  "what",
  "when",
  "with",
  "you",
  "your",
  "me",
  "im",
  "amp",
  "http",
  "https",
  "www",
  "about",
  "more",
  "than",
  "then",
  "out",
  "up",
  "all",
  "can",
  "will",
  "one",
  "get",
  "got",
  "did",
  "dont",
  "didnt",
]);

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type GraphResponse = Record<string, any>;

export type Manifest = {
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  api_version: string;
  base_url: string;
  field_fallbacks: Array<Record<string, unknown>>;
  warnings: string[];
  skipped_metrics: Array<Record<string, unknown>>;
  media_errors: Array<Record<string, unknown>>;
  counts: Record<string, number>;
};

export type SyncReport = {
  meta: {
    generated_at: string;
    started_at: string;
    api_version: string;
    account_id: string;
    snapshot_path: string;
    generator: string;
  };
  account: GraphResponse;
  account_insights: GraphResponse;
  media: GraphResponse[];
  analysis_facts: GraphResponse;
  highlights: {
    media_count: number;
    top_media_ids: Array<string | null | undefined>;
  };
  warnings: string[];
  fetch_manifest: Manifest;
};

export type ManualSyncResult = {
  report: SyncReport;
  summary: {
    username: string;
    mediaCount: number;
    warningCount: number;
    topMediaIds: Array<string | null | undefined>;
    durationSeconds: number;
  };
};

export type InstagramSyncBootstrap = {
  startedAt: string;
  apiVersion: string;
  baseUrl: string;
  manifest: Manifest;
};

export type InstagramProfileStageResult = {
  accountPayload: GraphResponse;
  canonicalAccountId: string;
};

class GraphApiError extends Error {
  payload?: GraphResponse;
  status?: number;

  constructor(message: string, payload?: GraphResponse, status?: number) {
    super(message);
    this.name = "GraphApiError";
    this.payload = payload;
    this.status = status;
  }
}

function nowUtc() {
  return new Date();
}

function timestampSlug(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function makeUrl(
  baseUrl: string,
  apiVersion: string,
  path: string,
  params: Record<string, string | number | undefined>,
) {
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/${apiVersion}/${path.replace(/^\//, "")}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

function compactError(error: unknown) {
  if (error instanceof GraphApiError && error.payload?.error) {
    const payloadError = error.payload.error as { message?: string; code?: number };
    if (payloadError.message) {
      return payloadError.code
        ? `${payloadError.message} (code=${payloadError.code})`
        : payloadError.message;
    }
  }

  return error instanceof Error ? error.message : "Unknown Instagram sync error.";
}

async function graphGet(url: URL, timeout = 60_000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as GraphResponse) : {};

    if (!response.ok) {
      throw new GraphApiError(
        `HTTP ${response.status} for ${url.toString()}`,
        payload,
        response.status,
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof GraphApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new GraphApiError(`Request timed out for ${url.toString()}`);
    }

    throw new GraphApiError(
      `Network error for ${url.toString()}: ${
        error instanceof Error ? error.message : "unknown"
      }`,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

async function graphGetPath(
  baseUrl: string,
  apiVersion: string,
  path: string,
  params: Record<string, string | number | undefined>,
) {
  return graphGet(makeUrl(baseUrl, apiVersion, path, params));
}

async function candidateFetch<T>({
  candidates,
  fetcher,
  manifest,
  category,
}: {
  candidates: string[][];
  fetcher: (fields: string[]) => Promise<T>;
  manifest: Manifest;
  category: string;
}) {
  let lastError: unknown;

  for (const fields of candidates) {
    try {
      const payload = await fetcher(fields);
      return { payload, fields };
    } catch (error) {
      lastError = error;
      manifest.field_fallbacks.push({
        category,
        fields,
        error: compactError(error),
      });
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`No field candidates succeeded for ${category}`);
}

async function fetchProfile({
  baseUrl,
  apiVersion,
  accountId,
  accessToken,
  manifest,
}: {
  baseUrl: string;
  apiVersion: string;
  accountId: string;
  accessToken: string;
  manifest: Manifest;
}): Promise<GraphResponse> {
  const { payload } = await candidateFetch({
    candidates: ACCOUNT_PROFILE_FIELD_CANDIDATES,
    fetcher: (fields) =>
      graphGetPath(baseUrl, apiVersion, "me", {
        fields: fields.join(","),
        access_token: accessToken,
      }),
    manifest,
    category: "account_profile",
  });

  return {
    ...payload,
    _configured_account_id: accountId,
    _canonical_account_id: String(payload.user_id ?? accountId),
  };
}

async function paginateMediaCatalog({
  baseUrl,
  apiVersion,
  accountId,
  accessToken,
  manifest,
}: {
  baseUrl: string;
  apiVersion: string;
  accountId: string;
  accessToken: string;
  manifest: Manifest;
}) {
  const fetchPage = async (after: string | null, fields: string[]) =>
    graphGetPath(baseUrl, apiVersion, `${accountId}/media`, {
      fields: fields.join(","),
      access_token: accessToken,
      limit: 50,
      after: after ?? undefined,
    });

  const { payload: firstPage, fields } = await candidateFetch({
    candidates: MEDIA_LIST_FIELD_CANDIDATES,
    fetcher: (fieldSet) => fetchPage(null, fieldSet),
    manifest,
    category: "media_list",
  });

  const items: GraphResponse[] = [];
  const pages: GraphResponse[] = [];
  let after: string | null = null;
  let index = 0;

  while (true) {
    const payload: GraphResponse =
      index === 0 ? firstPage : await fetchPage(after, fields);
    pages.push(payload);
    const data = Array.isArray(payload.data) ? payload.data : [];
    items.push(...data);

    const nextAfter: string | null =
      typeof payload.paging?.cursors?.after === "string"
        ? payload.paging.cursors.after
        : null;
    const nextUrl =
      typeof payload.paging?.next === "string" ? payload.paging.next : null;

    if (!nextAfter || !nextUrl) {
      break;
    }

    after = nextAfter;
    index += 1;
  }

  manifest.counts.media_catalog_items = items.length;
  manifest.counts.media_catalog_pages = pages.length;

  return items;
}

async function fetchAccountInsights({
  baseUrl,
  apiVersion,
  accountId,
  accessToken,
  manifest,
}: {
  baseUrl: string;
  apiVersion: string;
  accountId: string;
  accessToken: string;
  manifest: Manifest;
}) {
  const normalized: GraphResponse = {
    totals: {},
    time_series: {},
    breakdowns: {},
    demographics: {},
    errors: {},
  };

  const groups = {
    totals: ACCOUNT_TOTAL_METRICS,
    time_series: ACCOUNT_TIME_SERIES_METRICS,
    demographics: ACCOUNT_DEMOGRAPHIC_REQUESTS,
  };

  for (const [groupName, specs] of Object.entries(groups)) {
    for (const spec of specs) {
      const metricName = spec.metric;

      try {
        const payload = await graphGetPath(baseUrl, apiVersion, `${accountId}/insights`, {
          metric: spec.metric,
          period: spec.period,
          metric_type: spec.metric_type,
          timeframe: "timeframe" in spec ? spec.timeframe : undefined,
          breakdown: "breakdown" in spec ? spec.breakdown : undefined,
          access_token: accessToken,
        });

        const data = Array.isArray(payload.data) ? payload.data : [];
        const entry = data[0] ?? { name: metricName, empty: true };

        if (!data.length) {
          manifest.warnings.push(
            `Account metric '${metricName}' returned an empty dataset.`,
          );
        }

        if (groupName === "demographics") {
          normalized.demographics[metricName] = entry;
        } else {
          normalized[groupName][metricName] = entry;
          if ("total_value" in entry) {
            normalized.breakdowns[metricName] = entry.total_value ?? {};
          }
        }
      } catch (error) {
        normalized.errors[metricName] = compactError(error);
        manifest.skipped_metrics.push({
          scope: "account",
          metric: metricName,
          reason: compactError(error),
        });
      }
    }
  }

  return normalized;
}

async function fetchMediaDetail({
  baseUrl,
  apiVersion,
  mediaId,
  accessToken,
  manifest,
}: {
  baseUrl: string;
  apiVersion: string;
  mediaId: string;
  accessToken: string;
  manifest: Manifest;
}) {
  const { payload } = await candidateFetch({
    candidates: MEDIA_DETAIL_FIELD_CANDIDATES,
    fetcher: (fields) =>
      graphGetPath(baseUrl, apiVersion, mediaId, {
        fields: fields.join(","),
        access_token: accessToken,
      }),
    manifest,
    category: `media_detail:${mediaId}`,
  });

  return payload;
}

function normalizeMediaEntry(detail: GraphResponse, catalogEntry: GraphResponse) {
  const merged = { ...catalogEntry, ...detail };
  const mediaUrl = merged.media_url;
  const thumbnailUrl = merged.thumbnail_url;

  return {
    id: merged.id,
    caption: merged.caption,
    comments_count: merged.comments_count,
    like_count: merged.like_count,
    media_product_type: merged.media_product_type ?? "UNKNOWN",
    media_type: merged.media_type,
    media_url: mediaUrl,
    thumbnail_url: thumbnailUrl,
    preview_url: thumbnailUrl ?? mediaUrl,
    permalink: merged.permalink,
    shortcode: merged.shortcode,
    timestamp: merged.timestamp,
    username: merged.username,
    owner: merged.owner,
    children: merged.children ?? {},
    is_comment_enabled: merged.is_comment_enabled,
    top_comments: [] as GraphResponse[],
    insights: {
      metrics: {} as Record<string, GraphResponse>,
      breakdowns: {} as Record<string, GraphResponse>,
      errors: {} as Record<string, string>,
    },
    warnings: [] as string[],
    errors: [] as string[],
  };
}

function metricSpecsFor(mediaProductType: string) {
  const key = mediaProductType.toUpperCase();
  return MEDIA_METRIC_REQUESTS[key] ?? MEDIA_METRIC_REQUESTS.FEED;
}

async function fetchMediaBundle({
  baseUrl,
  apiVersion,
  accessToken,
  mediaCatalog,
  manifest,
}: {
  baseUrl: string;
  apiVersion: string;
  accessToken: string;
  mediaCatalog: GraphResponse[];
  manifest: Manifest;
}) {
  const normalizedMedia: GraphResponse[] = [];

  for (const catalogEntry of mediaCatalog) {
    const mediaId = catalogEntry.id;
    if (!mediaId) {
      continue;
    }

    let detail: GraphResponse;
    try {
      detail = await fetchMediaDetail({
        baseUrl,
        apiVersion,
        mediaId,
        accessToken,
        manifest,
      });
    } catch (error) {
      detail = { id: mediaId };
      manifest.media_errors.push({
        media_id: mediaId,
        stage: "detail",
        error: compactError(error),
      });
    }

    const normalized = normalizeMediaEntry(detail, catalogEntry);

    for (const metricSpec of metricSpecsFor(normalized.media_product_type)) {
      try {
        const payload = await graphGetPath(baseUrl, apiVersion, `${mediaId}/insights`, {
          metric: metricSpec.metric,
          breakdown: metricSpec.breakdown,
          access_token: accessToken,
        });

        const data = Array.isArray(payload.data) ? payload.data : [];
        const entry = data[0] ?? { name: metricSpec.metric, empty: true };
        normalized.insights.metrics[metricSpec.metric] = entry;

        if ("total_value" in entry) {
          normalized.insights.breakdowns[metricSpec.metric] = entry.total_value ?? {};
        } else if (entry.values) {
          normalized.insights.breakdowns[metricSpec.metric] = entry.values;
        }

        if (!data.length) {
          normalized.warnings.push(
            `Metric '${metricSpec.metric}' returned an empty dataset.`,
          );
        }
      } catch (error) {
        const message = compactError(error);
        normalized.insights.errors[metricSpec.metric] = message;
        normalized.errors.push(`${metricSpec.metric}: ${message}`);
        manifest.skipped_metrics.push({
          scope: "media",
          media_id: mediaId,
          metric: metricSpec.metric,
          reason: message,
        });
      }
    }

    normalizedMedia.push(normalized);
  }

  manifest.counts.media_items_processed = normalizedMedia.length;
  return normalizedMedia;
}

function metricScore(metricPayload: GraphResponse | undefined) {
  if (!metricPayload || typeof metricPayload !== "object") {
    return 0;
  }

  if (
    metricPayload.total_value &&
    typeof metricPayload.total_value === "object" &&
    typeof metricPayload.total_value.value === "number"
  ) {
    return metricPayload.total_value.value;
  }

  if (Array.isArray(metricPayload.values)) {
    return metricPayload.values.reduce((sum: number, item: GraphResponse) => {
      return typeof item?.value === "number" ? sum + item.value : sum;
    }, 0);
  }

  return 0;
}

function topMediaRank(item: GraphResponse): [number, number, number] {
  const metrics = item.insights?.metrics ?? {};

  return [
    metricScore(metrics.total_interactions),
    metricScore(metrics.reach),
    metricScore(metrics.views),
  ];
}

async function fetchCommentPage({
  baseUrl,
  apiVersion,
  mediaId,
  accessToken,
  fields,
  after,
  limit,
}: {
  baseUrl: string;
  apiVersion: string;
  mediaId: string;
  accessToken: string;
  fields: string[];
  after: string | null;
  limit: number;
}) {
  return graphGetPath(baseUrl, apiVersion, `${mediaId}/comments`, {
    fields: fields.join(","),
    access_token: accessToken,
    limit,
    after: after ?? undefined,
  });
}

function normalizeComment(comment: GraphResponse) {
  return {
    id: comment.id,
    text: comment.text,
    timestamp: comment.timestamp,
    username: comment.username,
    like_count: comment.like_count,
    replies_count: comment.replies_count,
  };
}

async function fetchTopMediaComments({
  baseUrl,
  apiVersion,
  accessToken,
  mediaItems,
  manifest,
  maxMedia = 10,
  maxCommentsPerMedia = 20,
}: {
  baseUrl: string;
  apiVersion: string;
  accessToken: string;
  mediaItems: GraphResponse[];
  manifest: Manifest;
  maxMedia?: number;
  maxCommentsPerMedia?: number;
}) {
  const rankedMedia = [...mediaItems].sort((a, b) => {
    const [a0, a1, a2] = topMediaRank(a);
    const [b0, b1, b2] = topMediaRank(b);
    return b0 - a0 || b1 - a1 || b2 - a2;
  });

  for (const item of rankedMedia.slice(0, maxMedia)) {
    const mediaId = item.id as string | undefined;
    if (!mediaId) {
      continue;
    }

    let chosenFields: string[] | null = null;
    const comments: GraphResponse[] = [];

    try {
      for (const fields of COMMENT_FIELD_CANDIDATES) {
        try {
          let payload = await fetchCommentPage({
            baseUrl,
            apiVersion,
            mediaId,
            accessToken,
            fields,
            after: null,
            limit: Math.min(maxCommentsPerMedia, 50),
          });
          chosenFields = fields;
          comments.push(
            ...(Array.isArray(payload.data) ? payload.data : []).map(normalizeComment),
          );

          let after =
            typeof payload.paging?.cursors?.after === "string"
              ? payload.paging.cursors.after
              : null;

          while (after && comments.length < maxCommentsPerMedia) {
            payload = await fetchCommentPage({
              baseUrl,
              apiVersion,
              mediaId,
              accessToken,
              fields,
              after,
              limit: Math.min(maxCommentsPerMedia - comments.length, 50),
            });
            comments.push(
              ...(Array.isArray(payload.data) ? payload.data : []).map(
                normalizeComment,
              ),
            );
            after =
              typeof payload.paging?.cursors?.after === "string"
                ? payload.paging.cursors.after
                : null;
          }

          break;
        } catch (error) {
          manifest.field_fallbacks.push({
            category: `media_comments:${mediaId}`,
            fields,
            error: compactError(error),
          });
        }
      }

      if (!chosenFields) {
        throw new Error("No comment field candidates succeeded.");
      }

      item.top_comments = comments
        .filter((comment) => comment.text)
        .slice(0, maxCommentsPerMedia);
      manifest.counts.comment_media_processed =
        (manifest.counts.comment_media_processed ?? 0) + 1;
      manifest.counts.top_comments_fetched =
        (manifest.counts.top_comments_fetched ?? 0) + item.top_comments.length;

      if (!item.top_comments.length) {
        item.warnings.push("No top comments were available for this media.");
      }
    } catch (error) {
      const message = compactError(error);
      item.warnings.push(`Top comments unavailable: ${message}`);
      manifest.warnings.push(
        `Top comments unavailable for media ${mediaId}: ${message}`,
      );
      manifest.media_errors.push({
        media_id: mediaId,
        stage: "comments",
        error: message,
      });
    }
  }
}

function truncateText(value: string, length = 120) {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length - 1).trimEnd()}...`;
}

function extractKeywords(texts: string[], limit = 8) {
  const counts = new Map<string, number>();

  for (const text of texts) {
    const tokens = text.toLowerCase().match(/[a-z][a-z0-9']{2,}/g) ?? [];
    for (const token of tokens) {
      if (STOPWORDS.has(token) || token.startsWith("http")) {
        continue;
      }

      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}

function summarizeTimeSeries(entry: GraphResponse) {
  const values = Array.isArray(entry?.values)
    ? entry.values
        .map((item: GraphResponse) =>
          typeof item?.value === "number" ? item.value : null,
        )
        .filter((value: number | null): value is number => value !== null)
    : [];

  if (!values.length) {
    return {};
  }

  const recent = values.length >= 7 ? values.slice(-7) : values;
  const previous =
    values.length >= 14 ? values.slice(-14, -7) : values.slice(0, -recent.length);
  const recentAverage =
    recent.reduce((sum, value) => sum + value, 0) / recent.length;
  const previousAverage = previous.length
    ? previous.reduce((sum, value) => sum + value, 0) / previous.length
    : null;
  const trendDeltaPct =
    previousAverage && previousAverage !== 0
      ? ((recentAverage - previousAverage) / previousAverage) * 100
      : null;

  return {
    points: values.length,
    latest: values[values.length - 1],
    recent_average: Number(recentAverage.toFixed(2)),
    previous_average:
      previousAverage === null ? null : Number(previousAverage.toFixed(2)),
    trend_delta_pct:
      trendDeltaPct === null ? null : Number(trendDeltaPct.toFixed(2)),
    peak: Math.max(...values),
  };
}

function daySpan(mediaItems: GraphResponse[]) {
  const timestamps = mediaItems
    .map((item) => item.timestamp)
    .filter((value): value is string => typeof value === "string")
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()));

  if (timestamps.length < 2) {
    return 1;
  }

  const min = Math.min(...timestamps.map((value) => value.getTime()));
  const max = Math.max(...timestamps.map((value) => value.getTime()));
  return Math.max(Math.floor((max - min) / (1000 * 60 * 60 * 24)), 1);
}

function compactMediaFact(item: GraphResponse, metricName: string) {
  const value = metricScore(item.insights?.metrics?.[metricName]);
  return {
    id: item.id,
    caption: truncateText(item.caption ?? "(no caption)", 120),
    media_product_type: item.media_product_type,
    permalink: item.permalink,
    value,
  };
}

function perSurfaceStats(mediaItems: GraphResponse[]) {
  const grouped = new Map<
    string,
    { count: number; interactions: number; reach: number; views: number }
  >();

  for (const item of mediaItems) {
    const surface = item.media_product_type ?? "UNKNOWN";
    const group = grouped.get(surface) ?? {
      count: 0,
      interactions: 0,
      reach: 0,
      views: 0,
    };

    group.count += 1;
    group.interactions += metricScore(item.insights?.metrics?.total_interactions);
    group.reach += metricScore(item.insights?.metrics?.reach);
    group.views += metricScore(item.insights?.metrics?.views);
    grouped.set(surface, group);
  }

  return Object.fromEntries(
    [...grouped.entries()].map(([surface, data]) => {
      const count = data.count || 1;
      return [
        surface,
        {
          count: data.count,
          avg_interactions: Number((data.interactions / count).toFixed(2)),
          avg_reach: Number((data.reach / count).toFixed(2)),
          avg_views: Number((data.views / count).toFixed(2)),
        },
      ];
    }),
  );
}

function buildAnalysisFacts({
  accountPayload,
  accountInsights,
  mediaItems,
  topMedia,
}: {
  accountPayload: GraphResponse;
  accountInsights: GraphResponse;
  mediaItems: GraphResponse[];
  topMedia: GraphResponse[];
}) {
  const captionTexts = topMedia
    .map((item) => item.caption)
    .filter((value): value is string => Boolean(value));
  const commentTexts = topMedia.flatMap((item) =>
    (item.top_comments ?? [])
      .map((comment: GraphResponse) => comment.text)
      .filter((value: string | undefined): value is string => Boolean(value)),
  );
  const surfaceStats = perSurfaceStats(mediaItems);
  const surfaceEntries = Object.entries(surfaceStats);
  const weakestSurfaces = [...surfaceEntries].sort(
    (a, b) =>
      (a[1] as GraphResponse).avg_interactions -
        (b[1] as GraphResponse).avg_interactions ||
      (a[1] as GraphResponse).count - (b[1] as GraphResponse).count,
  );
  const strongestSurfaces = [...surfaceEntries].sort(
    (a, b) =>
      (b[1] as GraphResponse).avg_interactions -
        (a[1] as GraphResponse).avg_interactions ||
      (b[1] as GraphResponse).count - (a[1] as GraphResponse).count,
  );
  const cadenceDays = daySpan(mediaItems);
  const postsPerWeek = mediaItems.length
    ? Number(((mediaItems.length / cadenceDays) * 7).toFixed(2))
    : 0;
  const totals = accountInsights.totals ?? {};
  const timeSeries = accountInsights.time_series ?? {};

  const byMetric = Object.fromEntries(
    ["total_interactions", "reach", "views", "saved", "shares", "comments"].map(
      (metricName) => {
        const ranked = [...mediaItems].sort(
          (a, b) =>
            metricScore(b.insights?.metrics?.[metricName]) -
            metricScore(a.insights?.metrics?.[metricName]),
        );
        return [metricName, ranked.slice(0, 5).map((item) => compactMediaFact(item, metricName))];
      },
    ),
  );

  const commentCoverage = topMedia.filter((item) => item.top_comments?.length).length;

  return {
    overview: {
      username: accountPayload.username,
      followers_count: accountPayload.followers_count,
      follows_count: accountPayload.follows_count,
      tracked_media_count: mediaItems.length,
      surface_breakdown: Object.fromEntries(
        Object.entries(surfaceStats).map(([surface, stats]) => [surface, stats.count]),
      ),
      posts_per_week: postsPerWeek,
      analysis_window_days: cadenceDays,
    },
    account_highlights: {
      totals: Object.fromEntries(
        [
          "accounts_engaged",
          "reach",
          "views",
          "likes",
          "comments",
          "shares",
          "saves",
          "total_interactions",
          "profile_links_taps",
        ].map((metricName) => [metricName, metricScore(totals[metricName])]),
      ),
      time_series: {
        reach: summarizeTimeSeries(timeSeries.reach),
        impressions: summarizeTimeSeries(timeSeries.impressions),
      },
    },
    top_performers: byMetric,
    content_patterns: {
      surface_stats: surfaceStats,
      strongest_surfaces: strongestSurfaces.slice(0, 3).map(([surface, stats]) => ({
        surface,
        ...stats,
      })),
      weakest_surfaces: weakestSurfaces.slice(0, 3).map(([surface, stats]) => ({
        surface,
        ...stats,
      })),
      caption_keywords: extractKeywords(captionTexts),
    },
    audience_response: {
      comment_coverage_media_count: commentCoverage,
      top_comment_keywords: extractKeywords(commentTexts),
      top_comment_samples: topMedia
        .filter((item) => item.top_comments?.length)
        .slice(0, 5)
        .map((item) => ({
          media_id: item.id,
          comments: item.top_comments.slice(0, 3),
        })),
    },
    recommendation_inputs: {
      strong_formats: strongestSurfaces.slice(0, 2).map(([surface, stats]) => ({
        surface,
        avg_interactions: (stats as GraphResponse).avg_interactions,
      })),
      weak_formats: weakestSurfaces.slice(0, 2).map(([surface, stats]) => ({
        surface,
        avg_interactions: (stats as GraphResponse).avg_interactions,
      })),
      underused_surfaces: [...surfaceEntries]
        .sort((a, b) => (a[1] as GraphResponse).count - (b[1] as GraphResponse).count)
        .slice(0, 2)
        .map(([surface, stats]) => ({
          surface,
          count: (stats as GraphResponse).count,
        })),
      outlier_posts: topMedia.slice(0, 3).map((item) => compactMediaFact(item, "total_interactions")),
    },
  };
}

function buildReport({
  startedAt,
  endedAt,
  apiVersion,
  accountId,
  accountPayload,
  accountInsights,
  mediaItems,
  manifest,
}: {
  startedAt: Date;
  endedAt: Date;
  apiVersion: string;
  accountId: string;
  accountPayload: GraphResponse;
  accountInsights: GraphResponse;
  mediaItems: GraphResponse[];
  manifest: Manifest;
}) {
  const topMedia = [...mediaItems].sort((a, b) => {
    const [a0, a1, a2] = topMediaRank(a);
    const [b0, b1, b2] = topMediaRank(b);
    return b0 - a0 || b1 - a1 || b2 - a2;
  });
  const warnings = [...new Set(manifest.warnings)];
  warnings.push("Media insight metrics can lag by up to 48 hours.");
  warnings.push("Stories can expire before all insight fields are available.");

  return {
    meta: {
      generated_at: endedAt.toISOString(),
      started_at: startedAt.toISOString(),
      api_version: apiVersion,
      account_id: accountId,
      snapshot_path: `manual-sync/${timestampSlug(endedAt)}`,
      generator: "apps/web/lib/instagram-sync.ts",
    },
    account: accountPayload,
    account_insights: accountInsights,
    media: mediaItems,
    analysis_facts: buildAnalysisFacts({
      accountPayload,
      accountInsights,
      mediaItems,
      topMedia: topMedia.slice(0, 10),
    }),
    highlights: {
      media_count: mediaItems.length,
      top_media_ids: topMedia.slice(0, 10).map((item) => item.id),
    },
    warnings,
    fetch_manifest: manifest,
  } satisfies SyncReport;
}

export function createInstagramSyncBootstrap(
  link: Pick<InstagramLink, "graphApiVersion">,
): InstagramSyncBootstrap {
  const startedAt = nowUtc();
  const apiVersion = link.graphApiVersion || getEnv("GRAPH_API_VERSION") || DEFAULT_API_VERSION;
  const baseUrl = getEnv("INSTAGRAM_GRAPH_BASE_URL") ?? DEFAULT_BASE_URL;

  return {
    startedAt: startedAt.toISOString(),
    apiVersion,
    baseUrl,
    manifest: {
      started_at: startedAt.toISOString(),
      api_version: apiVersion,
      base_url: baseUrl,
      field_fallbacks: [],
      warnings: [],
      skipped_metrics: [],
      media_errors: [],
      counts: {},
    },
  };
}

export async function runInstagramProfileStage(input: {
  link: Pick<
    InstagramLink,
    "instagramUserId" | "accessToken" | "graphApiVersion" | "username"
  >;
  apiVersion: string;
  baseUrl: string;
  manifest: Manifest;
}): Promise<InstagramProfileStageResult> {
  const accountPayload = await fetchProfile({
    baseUrl: input.baseUrl,
    apiVersion: input.apiVersion,
    accountId: input.link.instagramUserId,
    accessToken: input.link.accessToken,
    manifest: input.manifest,
  });

  const canonicalAccountId = String(
    accountPayload.user_id ??
      accountPayload._canonical_account_id ??
      input.link.instagramUserId,
  );

  if (canonicalAccountId !== String(input.link.instagramUserId)) {
    input.manifest.warnings.push(
      `Configured INSTAGRAM_USER_ID ${input.link.instagramUserId} resolved to canonical Instagram user ID ${canonicalAccountId}.`,
    );
  }

  return {
    accountPayload,
    canonicalAccountId,
  };
}

export async function runInstagramAccountInsightsStage(input: {
  canonicalAccountId: string;
  accessToken: string;
  apiVersion: string;
  baseUrl: string;
  manifest: Manifest;
}) {
  return fetchAccountInsights({
    baseUrl: input.baseUrl,
    apiVersion: input.apiVersion,
    accountId: input.canonicalAccountId,
    accessToken: input.accessToken,
    manifest: input.manifest,
  });
}

export async function runInstagramMediaCatalogStage(input: {
  canonicalAccountId: string;
  accessToken: string;
  apiVersion: string;
  baseUrl: string;
  manifest: Manifest;
}) {
  return paginateMediaCatalog({
    baseUrl: input.baseUrl,
    apiVersion: input.apiVersion,
    accountId: input.canonicalAccountId,
    accessToken: input.accessToken,
    manifest: input.manifest,
  });
}

export async function runInstagramMediaBundleStage(input: {
  accessToken: string;
  apiVersion: string;
  baseUrl: string;
  mediaCatalog: GraphResponse[];
  manifest: Manifest;
}) {
  return fetchMediaBundle({
    baseUrl: input.baseUrl,
    apiVersion: input.apiVersion,
    accessToken: input.accessToken,
    mediaCatalog: input.mediaCatalog,
    manifest: input.manifest,
  });
}

export async function runInstagramTopMediaCommentsStage(input: {
  accessToken: string;
  apiVersion: string;
  baseUrl: string;
  mediaItems: GraphResponse[];
  manifest: Manifest;
}) {
  await fetchTopMediaComments({
    baseUrl: input.baseUrl,
    apiVersion: input.apiVersion,
    accessToken: input.accessToken,
    mediaItems: input.mediaItems,
    manifest: input.manifest,
  });

  return input.mediaItems;
}

export function finalizeInstagramSyncResult(input: {
  startedAt: string;
  apiVersion: string;
  canonicalAccountId: string;
  accountPayload: GraphResponse;
  accountInsights: GraphResponse;
  mediaItems: GraphResponse[];
  manifest: Manifest;
  fallbackUsername?: string;
}): ManualSyncResult {
  const endedAt = nowUtc();
  input.manifest.ended_at = endedAt.toISOString();
  input.manifest.duration_seconds = Number(
    ((endedAt.getTime() - new Date(input.startedAt).getTime()) / 1000).toFixed(3),
  );

  const report = buildReport({
    startedAt: new Date(input.startedAt),
    endedAt,
    apiVersion: input.apiVersion,
    accountId: input.canonicalAccountId,
    accountPayload: input.accountPayload,
    accountInsights: input.accountInsights,
    mediaItems: input.mediaItems,
    manifest: input.manifest,
  });

  return {
    report,
    summary: {
      username: report.account.username ?? input.fallbackUsername ?? "unknown",
      mediaCount: report.media.length,
      warningCount: report.warnings.length,
      topMediaIds: report.highlights.top_media_ids,
      durationSeconds: input.manifest.duration_seconds ?? 0,
    },
  };
}

export async function runInstagramFullSync(link: InstagramLink): Promise<ManualSyncResult> {
  const bootstrap = createInstagramSyncBootstrap(link);
  const profile = await runInstagramProfileStage({
    link,
    apiVersion: bootstrap.apiVersion,
    baseUrl: bootstrap.baseUrl,
    manifest: bootstrap.manifest,
  });
  const accountInsights = await runInstagramAccountInsightsStage({
    canonicalAccountId: profile.canonicalAccountId,
    accessToken: link.accessToken,
    apiVersion: bootstrap.apiVersion,
    baseUrl: bootstrap.baseUrl,
    manifest: bootstrap.manifest,
  });
  const mediaCatalog = await runInstagramMediaCatalogStage({
    canonicalAccountId: profile.canonicalAccountId,
    accessToken: link.accessToken,
    apiVersion: bootstrap.apiVersion,
    baseUrl: bootstrap.baseUrl,
    manifest: bootstrap.manifest,
  });
  const mediaItems = await runInstagramMediaBundleStage({
    accessToken: link.accessToken,
    apiVersion: bootstrap.apiVersion,
    baseUrl: bootstrap.baseUrl,
    mediaCatalog,
    manifest: bootstrap.manifest,
  });

  await runInstagramTopMediaCommentsStage({
    accessToken: link.accessToken,
    apiVersion: bootstrap.apiVersion,
    baseUrl: bootstrap.baseUrl,
    mediaItems,
    manifest: bootstrap.manifest,
  });

  return finalizeInstagramSyncResult({
    startedAt: bootstrap.startedAt,
    apiVersion: bootstrap.apiVersion,
    canonicalAccountId: profile.canonicalAccountId,
    accountPayload: profile.accountPayload,
    accountInsights,
    mediaItems,
    manifest: bootstrap.manifest,
    fallbackUsername: link.username,
  });
}
