import type {
  InstagramMediaDetail,
  PrecomputedAnalysisAccountSummary,
  PrecomputedAnalysisPost,
  PrecomputedAnalysisReport,
} from "@instagram-insights/contracts";

export const ANALYSIS_VERSION = "v1";
export const PRECOMPUTED_REPORT_DAYS = 30;
export const PRECOMPUTED_REPORT_KEY = "30d";

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "just",
  "me",
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
  "up",
  "was",
  "we",
  "with",
  "you",
  "your",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function round(value: number, precision = 4) {
  return Number(value.toFixed(precision));
}

function metricValue(metricPayload: unknown) {
  if (typeof metricPayload === "number") {
    return metricPayload;
  }

  if (!isRecord(metricPayload)) {
    return 0;
  }

  if (typeof metricPayload.value === "number") {
    return metricPayload.value;
  }

  const totalValue = metricPayload.total_value;
  if (isRecord(totalValue) && typeof totalValue.value === "number") {
    return totalValue.value;
  }

  if (Array.isArray(metricPayload.values)) {
    return metricPayload.values.reduce((sum, item) => {
      if (!isRecord(item) || typeof item.value !== "number") {
        return sum;
      }

      return sum + item.value;
    }, 0);
  }

  return 0;
}

function firstSentence(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  const match = normalized.match(/^.+?[.!?](?=\s|$)/);
  return (match?.[0] ?? normalized).trim();
}

function normalizeHashtag(tag: string) {
  return tag.replace(/^#/, "").toLowerCase();
}

export function extractHashtags(caption: string | null | undefined) {
  if (!caption) {
    return [] as string[];
  }

  const hashtags = new Set<string>();
  const matches = caption.matchAll(/(^|\s)#([a-z0-9_]+)/gi);

  for (const match of matches) {
    const value = normalizeHashtag(match[2] ?? "");
    if (value) {
      hashtags.add(value);
    }
  }

  return [...hashtags];
}

function keywordTokens(text: string) {
  return text
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[@#][\w_]+/g, " ")
    .toLowerCase()
    .match(/[a-z][a-z0-9']{2,}/g) ?? [];
}

export function extractTheme(input: {
  caption: string | null;
  transcript: string | null;
}) {
  const combined = [input.transcript, input.caption].filter(Boolean).join(" ");
  const counts = new Map<string, { count: number; firstIndex: number }>();

  keywordTokens(combined).forEach((token, index) => {
    if (STOPWORDS.has(token)) {
      return;
    }

    const current = counts.get(token);
    if (!current) {
      counts.set(token, { count: 1, firstIndex: index });
      return;
    }

    current.count += 1;
  });

  const ranked = [...counts.entries()].sort((a, b) => {
    return b[1].count - a[1].count || a[1].firstIndex - b[1].firstIndex;
  });

  return ranked[0]?.[0] ?? "uncategorized";
}

function sortPostsNewestFirst<T extends { postedAt: string | null; id: string }>(posts: T[]) {
  return [...posts].sort((a, b) => {
    const aTime = parseTimestamp(a.postedAt)?.getTime() ?? 0;
    const bTime = parseTimestamp(b.postedAt)?.getTime() ?? 0;
    return bTime - aTime || a.id.localeCompare(b.id);
  });
}

export function buildPrecomputedMediaAnalysis(
  media: InstagramMediaDetail,
): PrecomputedAnalysisPost {
  const insights = isRecord(media.insights) ? media.insights : null;
  const metrics = isRecord(insights?.metrics) ? insights.metrics : {};
  const transcript = media.transcriptText ?? null;
  const likes = media.likeCount ?? metricValue(metrics.likes);
  const comments = media.commentsCount ?? metricValue(metrics.comments);
  const saves = metricValue(metrics.saved);
  const shares = metricValue(metrics.shares);
  const views = metricValue(metrics.views);
  const reach = metricValue(metrics.reach);
  const denominator = reach > 0 ? reach : null;
  const engagementRate =
    denominator === null
      ? null
      : round((likes + comments + saves + shares) / denominator, 6);

  return {
    id: media.id,
    postedAt: media.postedAt,
    type: media.mediaType ?? media.mediaProductType ?? null,
    caption: media.caption,
    transcript,
    hook: firstSentence(transcript) ?? firstSentence(media.caption),
    theme: extractTheme({
      caption: media.caption,
      transcript,
    }),
    hashtags: extractHashtags(media.caption),
    views,
    reach,
    likes,
    saves,
    shares,
    comments,
    engagementRate,
    permalink: media.permalink,
    thumbnailUrl: media.thumbnailUrl,
    analysisVersion: ANALYSIS_VERSION,
  };
}

function average(values: Array<number | null>) {
  const defined = values.filter((value): value is number => value !== null);
  if (!defined.length) {
    return null;
  }

  return round(defined.reduce((sum, value) => sum + value, 0) / defined.length);
}

function sum(values: Array<number | null>): number {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

function topPostsByMetric(posts: PrecomputedAnalysisPost[], metric: keyof PrecomputedAnalysisPost) {
  return [...posts]
    .sort((a, b) => {
      const aValue = typeof a[metric] === "number" ? (a[metric] as number) : -1;
      const bValue = typeof b[metric] === "number" ? (b[metric] as number) : -1;
      return bValue - aValue;
    })
    .slice(0, 5);
}

export function buildPrecomputedAnalysisReport(input: {
  account: Record<string, unknown>;
  mediaRows: InstagramMediaDetail[];
  generatedAt?: Date;
}) {
  const generatedAt = input.generatedAt ?? new Date();
  const since = new Date(
    generatedAt.getTime() - PRECOMPUTED_REPORT_DAYS * 24 * 60 * 60 * 1000,
  );

  const accountSummary: PrecomputedAnalysisAccountSummary = {
    username:
      typeof input.account.username === "string" ? input.account.username : null,
    followers:
      typeof input.account.followers_count === "number"
        ? input.account.followers_count
        : null,
    following:
      typeof input.account.follows_count === "number"
        ? input.account.follows_count
        : null,
    bio: typeof input.account.biography === "string" ? input.account.biography : null,
    website: typeof input.account.website === "string" ? input.account.website : null,
    profilePictureUrl:
      typeof input.account.profile_picture_url === "string"
        ? input.account.profile_picture_url
        : null,
  };

  const posts = sortPostsNewestFirst(
    input.mediaRows
      .filter((row) => {
        const postedAt = parseTimestamp(row.postedAt);
        return postedAt ? postedAt >= since && postedAt <= generatedAt : false;
      })
      .map(buildPrecomputedMediaAnalysis),
  );

  const themeMap = new Map<string, PrecomputedAnalysisPost[]>();
  const hashtagCounts = new Map<string, number>();

  for (const post of posts) {
    const theme = post.theme ?? "uncategorized";
    const themed = themeMap.get(theme) ?? [];
    themed.push(post);
    themeMap.set(theme, themed);

    for (const hashtag of post.hashtags) {
      hashtagCounts.set(hashtag, (hashtagCounts.get(hashtag) ?? 0) + 1);
    }
  }

  const themeAverages = [...themeMap.entries()]
    .map(([theme, themedPosts]) => ({
      theme,
      postCount: themedPosts.length,
      avgViews: average(themedPosts.map((post) => post.views)),
      avgReach: average(themedPosts.map((post) => post.reach)),
      avgLikes: average(themedPosts.map((post) => post.likes)),
      avgSaves: average(themedPosts.map((post) => post.saves)),
      avgShares: average(themedPosts.map((post) => post.shares)),
      avgComments: average(themedPosts.map((post) => post.comments)),
      avgEngagementRate: average(themedPosts.map((post) => post.engagementRate)),
    }))
    .sort((a, b) => b.postCount - a.postCount || a.theme.localeCompare(b.theme));

  const hashtags = [...hashtagCounts.entries()]
    .map(([hashtag, count]) => ({ hashtag, count }))
    .sort((a, b) => b.count - a.count || a.hashtag.localeCompare(b.hashtag));

  return {
    generatedAt: generatedAt.toISOString(),
    analysisVersion: ANALYSIS_VERSION,
    window: {
      since: since.toISOString(),
      until: generatedAt.toISOString(),
      days: PRECOMPUTED_REPORT_DAYS,
    },
    accountSummary,
    posts,
    aggregates: {
      totals: {
        postCount: posts.length,
        views: sum(posts.map((post) => post.views)),
        reach: sum(posts.map((post) => post.reach)),
        likes: sum(posts.map((post) => post.likes)),
        saves: sum(posts.map((post) => post.saves)),
        shares: sum(posts.map((post) => post.shares)),
        comments: sum(posts.map((post) => post.comments)),
        avgEngagementRate: average(posts.map((post) => post.engagementRate)),
      },
      themeAverages,
      topPostsByMetric: {
        views: topPostsByMetric(posts, "views"),
        reach: topPostsByMetric(posts, "reach"),
        likes: topPostsByMetric(posts, "likes"),
        saves: topPostsByMetric(posts, "saves"),
        shares: topPostsByMetric(posts, "shares"),
        comments: topPostsByMetric(posts, "comments"),
        engagementRate: topPostsByMetric(posts, "engagementRate"),
      },
      hashtags,
    },
  } satisfies PrecomputedAnalysisReport;
}
