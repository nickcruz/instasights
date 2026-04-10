import type {
  InstagramMediaListItem,
  LinkedInstagramAccountSummary,
  PrecomputedAnalysisReport,
} from "./types";

export type HookType =
  | "Number/Stat Hook"
  | "Question/Challenge Hook"
  | "Personal Story Hook"
  | "Statement Hook";

export type DashboardStatCard = {
  label: string;
  value: number;
  sublabel: string;
  compact?: boolean;
};

export type DashboardPost = {
  id: string;
  title: string;
  postedAt: string | null;
  caption: string | null;
  transcript: string | null;
  hook: string | null;
  hookType: HookType;
  theme: string;
  seriesLabel: string | null;
  permalink: string | null;
  thumbnailUrl: string | null;
  views: number;
  reach: number;
  likes: number;
  saves: number;
  shares: number;
  comments: number;
  engagementRatePercent: number | null;
  hasTranscript: boolean;
};

export type DashboardThemePerformance = {
  label: string;
  totalViews: number;
  totalReach: number;
  postCount: number;
  avgViews: number;
  avgEngagementRatePercent: number | null;
  avgSaves: number;
  avgShares: number;
  shareOfViews: number;
};

export type DashboardHookPerformance = {
  label: HookType;
  avgViews: number;
  postCount: number;
  shareOfPosts: number;
  bestExample: string | null;
  bestViews: number;
};

export type DashboardKeywordPerformance = {
  keyword: string;
  totalViews: number;
  mentions: number;
};

export type DashboardHashtagPerformance = {
  hashtag: string;
  totalViews: number;
  postCount: number;
};

export type DashboardInsight = {
  title: string;
  body: string;
};

export type DashboardPatternRow = {
  pattern: string;
  value: string;
};

export type DashboardNumberCallout = {
  value: string;
  description: string;
};

export type DashboardStarPost = {
  title: string;
  hook: string | null;
  views: number;
  multiplier: number | null;
  theme: string;
  permalink: string | null;
};

export type DashboardModel = {
  username: string;
  title: string;
  windowLabel: string;
  generatedAtLabel: string;
  postCountLabel: string;
  totals: {
    views: number;
    reach: number;
    likes: number;
    saves: number;
    shares: number;
    postCount: number;
    avgViews: number;
    avgEngagementRatePercent: number | null;
  };
  statCards: DashboardStatCard[];
  starPost: DashboardStarPost | null;
  themePerformance: DashboardThemePerformance[];
  hookPerformance: DashboardHookPerformance[];
  posts: DashboardPost[];
  keywordPerformance: DashboardKeywordPerformance[];
  hashtagPerformance: DashboardHashtagPerformance[];
  topHooks: DashboardPost[];
  performancePatterns: DashboardPatternRow[];
  hookGuidance: DashboardInsight[];
  strategicInsights: {
    doMoreOf: DashboardInsight[];
    doLessOf: DashboardInsight[];
    untappedOpportunities: DashboardInsight[];
  };
  numberCallouts: DashboardNumberCallout[];
};

type KeywordStat = {
  keyword: string;
  totalViews: number;
  mentions: number;
};

const KEYWORD_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "being",
  "below",
  "bio",
  "but",
  "by",
  "comment",
  "comments",
  "dm",
  "ep",
  "episode",
  "for",
  "from",
  "get",
  "guide",
  "had",
  "has",
  "have",
  "here",
  "how",
  "i",
  "if",
  "in",
  "into",
  "instagram",
  "is",
  "it",
  "its",
  "join",
  "just",
  "link",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "part",
  "post",
  "posts",
  "reel",
  "reels",
  "setup",
  "so",
  "that",
  "the",
  "their",
  "them",
  "they",
  "this",
  "to",
  "today",
  "up",
  "us",
  "using",
  "video",
  "videos",
  "was",
  "we",
  "what",
  "when",
  "where",
  "who",
  "why",
  "with",
  "you",
  "your",
]);

const NUMBER_WORDS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "hundred",
  "thousand",
  "million",
  "billion",
];

const AI_KEYWORDS = [
  "ai",
  "anthropic",
  "chatgpt",
  "claude",
  "gpt",
  "llm",
  "models",
  "prompt",
  "prompts",
];

const FINANCE_KEYWORDS = [
  "finance",
  "finances",
  "financial",
  "freedom",
  "income",
  "investor",
  "investing",
  "money",
  "real estate",
  "social security",
  "tax",
  "taxes",
  "wealth",
  "w2",
];

const RELATIONSHIP_KEYWORDS = [
  "couple",
  "couples",
  "husband",
  "marriage",
  "married",
  "partner",
  "partners",
  "wife",
];

const FOUNDER_KEYWORDS = [
  "builder",
  "building",
  "business",
  "ceo",
  "company",
  "founder",
  "founders",
  "revenue",
  "startup",
  "startups",
];

const WOMEN_IN_TECH_KEYWORDS = [
  "conference",
  "female",
  "tech",
  "women",
];

function toDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeWhitespace(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function truncate(value: string | null | undefined, maxLength: number) {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return null;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function metricValue(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function round(value: number, precision = 1) {
  return Number(value.toFixed(precision));
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function averageNullable(values: Array<number | null>) {
  const defined = values.filter((value): value is number => typeof value === "number");

  if (defined.length === 0) {
    return null;
  }

  return average(defined);
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => {
      if (/^\$?\d/.test(segment)) {
        return segment.toUpperCase();
      }

      return `${segment.slice(0, 1).toUpperCase()}${segment.slice(1)}`;
    })
    .join(" ");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

export function buildWindowLabel(report: PrecomputedAnalysisReport) {
  const since = toDate(report.window.since);
  const until = toDate(report.window.until);

  if (!since || !until) {
    return `${report.window.days}-day window`;
  }

  const sameYear = since.getUTCFullYear() === until.getUTCFullYear();
  const startLabel = formatDate(since, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const endLabel = formatDate(until, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startLabel} – ${endLabel}`;
}

function firstSentence(value: string | null | undefined) {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return null;
  }

  const match = normalized.match(/^.+?[.!?](?=\s|$)/);
  return (match?.[0] ?? normalized).trim();
}

function extractSeriesLabel(caption: string | null | undefined) {
  if (!caption) {
    return null;
  }

  const lines = caption
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  for (const line of lines) {
    const episodeMatch = line.match(
      /(?:^|\b)(?:ep(?:isode)?\.?\s*\d+\s*[-–—:]?\s*)([A-Za-z0-9$][A-Za-z0-9$ '&/]+)$/i,
    );

    if (episodeMatch?.[1]) {
      return titleCase(episodeMatch[1]);
    }
  }

  for (const line of lines) {
    const alphaChars = line.replace(/[^a-z]/gi, "");
    if (!alphaChars) {
      continue;
    }

    const uppercaseChars = alphaChars.replace(/[^A-Z]/g, "").length;
    const uppercaseRatio = uppercaseChars / alphaChars.length;
    const wordCount = line.split(/\s+/).length;

    if (uppercaseRatio >= 0.65 && wordCount >= 2 && wordCount <= 6 && line.length <= 60) {
      return titleCase(line);
    }
  }

  return null;
}

function textIncludesKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => {
    if (keyword.includes(" ")) {
      return text.includes(keyword);
    }

    return new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i").test(text);
  });
}

function prettifyStoredTheme(value: string | null | undefined) {
  const normalized = normalizeWhitespace(value);

  if (!normalized || normalized === "uncategorized") {
    return null;
  }

  if (normalized.includes(" ")) {
    return titleCase(normalized);
  }

  return normalized.slice(0, 1).toUpperCase() + normalized.slice(1);
}

export function classifyHookType(input: {
  hook?: string | null;
  transcript?: string | null;
  caption?: string | null;
}): HookType {
  const primaryText = normalizeWhitespace(
    input.hook ?? firstSentence(input.transcript) ?? firstSentence(input.caption),
  );
  const lower = primaryText.toLowerCase();

  if (!lower) {
    return "Statement Hook";
  }

  const hasNumberWord = NUMBER_WORDS.some((word) =>
    new RegExp(`\\b${escapeRegExp(word)}\\b`, "i").test(lower),
  );
  if (/[0-9$%]/.test(primaryText) || hasNumberWord) {
    return "Number/Stat Hook";
  }

  if (
    /\?/.test(primaryText) ||
    /^(did you know|how |what |why |when |where |which |who |if you|you tell me)/i.test(
      primaryText,
    )
  ) {
    return "Question/Challenge Hook";
  }

  if (
    /^(i |i'|i’m|i'm|we |we'|we’re|we're|my |our |as a |as an )/i.test(primaryText) ||
    /\b(my|our|we|i)\b/i.test(primaryText)
  ) {
    return "Personal Story Hook";
  }

  return "Statement Hook";
}

function keywordTokens(value: string | null | undefined) {
  return normalizeWhitespace(value)
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[@#][\w_]+/g, " ")
    .toLowerCase()
    .match(/[a-z][a-z0-9']{2,}/g) ?? [];
}

function extractHashtagsFromCaption(value: string | null | undefined) {
  if (!value) {
    return [] as string[];
  }

  const hashtags = new Set<string>();
  const matches = value.matchAll(/(^|\s)#([a-z0-9_]+)/gi);

  for (const match of matches) {
    const tag = (match[2] ?? "").toLowerCase();
    if (tag) {
      hashtags.add(tag);
    }
  }

  return [...hashtags];
}

type RawPost = DashboardPost & {
  storedTheme: string | null;
};

function buildPostTitle(post: {
  caption: string | null;
  hook: string | null;
  seriesLabel: string | null;
}) {
  const lines = (post.caption ?? "")
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const firstUsefulLine =
    lines.find((line) => !/^[@#]/.test(line) && line.length > 3) ??
    post.seriesLabel ??
    post.hook ??
    "Instagram post";

  return truncate(firstUsefulLine, 90) ?? "Instagram post";
}

function classifyPresentationTheme(post: RawPost, seriesCounts: Map<string, number>) {
  if (post.seriesLabel && (seriesCounts.get(post.seriesLabel) ?? 0) >= 2) {
    return post.seriesLabel;
  }

  const text = [post.caption, post.hook, post.transcript]
    .map((value) => normalizeWhitespace(value).toLowerCase())
    .filter(Boolean)
    .join(" ");

  const hasFinance = textIncludesKeyword(text, FINANCE_KEYWORDS);
  const hasRelationship = textIncludesKeyword(text, RELATIONSHIP_KEYWORDS);
  const hasAi = textIncludesKeyword(text, AI_KEYWORDS);
  const hasFounder = textIncludesKeyword(text, FOUNDER_KEYWORDS);
  const hasWomenInTech = textIncludesKeyword(text, WOMEN_IN_TECH_KEYWORDS);

  if (hasFinance && hasRelationship) {
    return "Finance / Relationships";
  }

  if (hasFinance) {
    return "Finance";
  }

  if (hasAi) {
    return "Practical AI";
  }

  if (hasWomenInTech && hasFounder) {
    return "Women in Tech/Founding";
  }

  if (hasFounder) {
    return "Founder / Builder";
  }

  return prettifyStoredTheme(post.storedTheme) ?? "Other";
}

function mergeReportMedia(
  report: PrecomputedAnalysisReport,
  mediaItems: InstagramMediaListItem[],
) {
  const mergedById = new Map<
    string,
    {
      media?: InstagramMediaListItem;
      reportPost?: PrecomputedAnalysisReport["posts"][number];
    }
  >();

  for (const reportPost of report.posts) {
    mergedById.set(reportPost.id, {
      reportPost,
    });
  }

  for (const media of mediaItems) {
    const current = mergedById.get(media.id) ?? {};
    mergedById.set(media.id, {
      ...current,
      media,
    });
  }

  const merged = [...mergedById.entries()].map(([id, value]) => {
    const media = value.media;
    const reportPost = value.reportPost;
    const caption = media?.caption ?? reportPost?.caption ?? null;
    const transcript = media?.transcriptText ?? media?.transcript ?? reportPost?.transcript ?? null;
    const hook = media?.hook ?? reportPost?.hook ?? firstSentence(transcript) ?? firstSentence(caption);
    const postedAt = media?.postedAt ?? reportPost?.postedAt ?? null;
    const engagementRateRaw =
      typeof media?.engagementRate === "number"
        ? media.engagementRate
        : typeof reportPost?.engagementRate === "number"
          ? reportPost.engagementRate
          : null;
    const seriesLabel = extractSeriesLabel(caption);

    return {
      id,
      title: "",
      postedAt,
      caption,
      transcript,
      hook,
      hookType: classifyHookType({
        hook,
        transcript,
        caption,
      }),
      theme: "",
      seriesLabel,
      permalink: media?.permalink ?? reportPost?.permalink ?? null,
      thumbnailUrl: media?.thumbnailUrl ?? reportPost?.thumbnailUrl ?? null,
      views: metricValue(media?.views ?? reportPost?.views),
      reach: metricValue(media?.reach ?? reportPost?.reach),
      likes: metricValue(media?.likes ?? reportPost?.likes ?? media?.likeCount),
      saves: metricValue(media?.saves ?? reportPost?.saves),
      shares: metricValue(media?.shares ?? reportPost?.shares),
      comments: metricValue(media?.comments ?? reportPost?.comments ?? media?.commentsCount),
      engagementRatePercent:
        typeof engagementRateRaw === "number" ? round(engagementRateRaw * 100, 1) : null,
      hasTranscript: Boolean(transcript),
      storedTheme: media?.theme ?? reportPost?.theme ?? null,
      hashtags:
        media?.hashtags && media.hashtags.length > 0
          ? media.hashtags
          : extractHashtagsFromCaption(caption),
    };
  });

  const seriesCounts = new Map<string, number>();

  for (const post of merged) {
    if (!post.seriesLabel) {
      continue;
    }

    seriesCounts.set(post.seriesLabel, (seriesCounts.get(post.seriesLabel) ?? 0) + 1);
  }

  return merged.map((post) => {
    const theme = classifyPresentationTheme(post, seriesCounts);

    return {
      ...post,
      theme,
      title: buildPostTitle({
        caption: post.caption,
        hook: post.hook,
        seriesLabel: post.seriesLabel,
      }),
    };
  });
}

export function buildKeywordPerformance(posts: Array<Pick<DashboardPost, "caption" | "views">>) {
  const stats = new Map<string, KeywordStat>();

  for (const post of posts) {
    const tokens = keywordTokens(post.caption);
    const filtered = tokens.filter((token) => !KEYWORD_STOPWORDS.has(token));
    const unique = new Set<string>();

    for (const token of filtered) {
      unique.add(token);
    }

    for (let index = 0; index < filtered.length - 1; index += 1) {
      unique.add(`${filtered[index]} ${filtered[index + 1]}`);
    }

    for (const keyword of unique) {
      const current = stats.get(keyword) ?? {
        keyword,
        totalViews: 0,
        mentions: 0,
      };

      current.totalViews += post.views;
      current.mentions += 1;
      stats.set(keyword, current);
    }
  }

  const ranked = [...stats.values()]
    .filter((keyword) => keyword.mentions >= 2 || keyword.totalViews >= 5_000)
    .sort((a, b) => {
      const wordCountA = a.keyword.split(" ").length;
      const wordCountB = b.keyword.split(" ").length;

      return (
        b.totalViews - a.totalViews ||
        b.mentions - a.mentions ||
        wordCountB - wordCountA ||
        a.keyword.localeCompare(b.keyword)
      );
    });

  const selected: KeywordStat[] = [];

  for (const keyword of ranked) {
    const keywordWords = keyword.keyword.split(" ");
    const isSuppressed = selected.some((existing) => {
      if (keywordWords.length !== 1) {
        return false;
      }

      return (
        existing.keyword.includes(keyword.keyword) &&
        existing.totalViews >= keyword.totalViews * 0.9
      );
    });

    if (isSuppressed) {
      continue;
    }

    selected.push(keyword);

    if (selected.length === 15) {
      break;
    }
  }

  return selected.map((keyword) => ({
    keyword: keyword.keyword,
    totalViews: keyword.totalViews,
    mentions: keyword.mentions,
  }));
}

export function buildHashtagPerformance(
  posts: Array<Pick<DashboardPost, "caption" | "views"> & { hashtags?: string[] | null }>,
) {
  const stats = new Map<string, DashboardHashtagPerformance>();

  for (const post of posts) {
    const tags = new Set(
      (post.hashtags && post.hashtags.length > 0 ? post.hashtags : extractHashtagsFromCaption(post.caption))
        .map((tag) => tag.replace(/^#/, "").toLowerCase())
        .filter(Boolean),
    );

    for (const tag of tags) {
      const current = stats.get(tag) ?? {
        hashtag: tag,
        totalViews: 0,
        postCount: 0,
      };

      current.totalViews += post.views;
      current.postCount += 1;
      stats.set(tag, current);
    }
  }

  return [...stats.values()]
    .sort((a, b) => {
      return (
        b.totalViews - a.totalViews ||
        b.postCount - a.postCount ||
        a.hashtag.localeCompare(b.hashtag)
      );
    })
    .slice(0, 12);
}

function buildThemePerformance(posts: DashboardPost[], totalViews: number) {
  const byTheme = new Map<string, DashboardPost[]>();

  for (const post of posts) {
    const grouped = byTheme.get(post.theme) ?? [];
    grouped.push(post);
    byTheme.set(post.theme, grouped);
  }

  return [...byTheme.entries()]
    .map(([label, themedPosts]) => {
      const views = themedPosts.map((post) => post.views);
      const reach = themedPosts.map((post) => post.reach);
      const saves = themedPosts.map((post) => post.saves);
      const shares = themedPosts.map((post) => post.shares);
      const engagementRates = themedPosts.map((post) => post.engagementRatePercent);

      return {
        label,
        totalViews: sum(views),
        totalReach: sum(reach),
        postCount: themedPosts.length,
        avgViews: average(views),
        avgEngagementRatePercent: averageNullable(engagementRates),
        avgSaves: average(saves),
        avgShares: average(shares),
        shareOfViews: totalViews > 0 ? sum(views) / totalViews : 0,
      } satisfies DashboardThemePerformance;
    })
    .sort((a, b) => {
      return b.totalViews - a.totalViews || b.avgViews - a.avgViews || a.label.localeCompare(b.label);
    });
}

function buildHookPerformance(posts: DashboardPost[]) {
  const byHook = new Map<HookType, DashboardPost[]>();

  for (const post of posts) {
    const grouped = byHook.get(post.hookType) ?? [];
    grouped.push(post);
    byHook.set(post.hookType, grouped);
  }

  return [...byHook.entries()]
    .map(([label, hookedPosts]) => {
      const avgViews = average(hookedPosts.map((post) => post.views));
      const bestPost = [...hookedPosts].sort((a, b) => b.views - a.views)[0] ?? null;

      return {
        label,
        avgViews,
        postCount: hookedPosts.length,
        shareOfPosts: posts.length > 0 ? hookedPosts.length / posts.length : 0,
        bestExample: bestPost?.hook ?? bestPost?.title ?? null,
        bestViews: bestPost?.views ?? 0,
      } satisfies DashboardHookPerformance;
    })
    .sort((a, b) => {
      return b.avgViews - a.avgViews || b.postCount - a.postCount || a.label.localeCompare(b.label);
    });
}

function buildPerformancePatterns(input: {
  themePerformance: DashboardThemePerformance[];
  hookPerformance: DashboardHookPerformance[];
  posts: DashboardPost[];
}) {
  const rows: DashboardPatternRow[] = [];
  const topTheme = input.themePerformance[0];
  const topHook = input.hookPerformance[0];
  const seriesPosts = input.posts.filter((post) => post.seriesLabel);
  const withTranscripts = input.posts.filter((post) => post.hasTranscript);

  if (topHook) {
    rows.push({
      pattern: `${topHook.label} openings`,
      value: `${formatCompactNumber(topHook.avgViews)} avg views`,
    });
  }

  if (topTheme) {
    rows.push({
      pattern: `${topTheme.label} theme`,
      value: `${formatPercent(topTheme.shareOfViews * 100, 0)} of total views`,
    });
  }

  if (seriesPosts.length >= 2) {
    rows.push({
      pattern: "Recurring series labels",
      value: `${formatCompactNumber(average(seriesPosts.map((post) => post.views)))} avg views`,
    });
  }

  if (withTranscripts.length > 0) {
    rows.push({
      pattern: "Posts with transcript-backed hooks",
      value: `${formatCompactNumber(average(withTranscripts.map((post) => post.views)))} avg views`,
    });
  }

  return rows.slice(0, 4);
}

function buildHookGuidance(hookPerformance: DashboardHookPerformance[]) {
  const topHook = hookPerformance[0]?.label ?? "Statement Hook";

  return [
    topHook === "Number/Stat Hook"
      ? {
          title: "Lead with a concrete number",
          body: "Specific numbers, dollar amounts, and percentages are the fastest way to signal a clear payoff.",
        }
      : {
          title: `Lean into ${topHook.replace(" Hook", "").toLowerCase()} framing`,
          body: "The strongest opening pattern in this window is worth repeating with fresh subject matter.",
        },
    {
      title: "Keep the first beat short",
      body: "The best-performing hooks land in one fast sentence and make the payoff obvious before the viewer can scroll away.",
    },
    {
      title: "Tie the claim to a practical outcome",
      body: "Hooks that quickly connect to money, growth, or a concrete transformation tend to travel farther and earn more saves.",
    },
    {
      title: "Make the topic easy to classify",
      body: "Consistent series labels, repeated language, and recognizable themes help viewers know why they should keep watching.",
    },
  ];
}

function buildStrategicInsights(input: {
  posts: DashboardPost[];
  totals: DashboardModel["totals"];
  themePerformance: DashboardThemePerformance[];
  hookPerformance: DashboardHookPerformance[];
  keywordPerformance: DashboardKeywordPerformance[];
}) {
  const { posts, totals, themePerformance, hookPerformance, keywordPerformance } = input;
  const overallAvgViews = totals.avgViews;
  const lowestTheme = [...themePerformance]
    .filter((theme) => theme.postCount >= 2)
    .sort((a, b) => a.avgViews - b.avgViews)[0] ?? null;
  const lowestHook = [...hookPerformance]
    .filter((hook) => hook.postCount >= 2)
    .sort((a, b) => a.avgViews - b.avgViews)[0] ?? null;
  const promisingTheme = [...themePerformance]
    .filter((theme) => theme.postCount <= 2 && theme.avgViews >= overallAvgViews)
    .sort((a, b) => b.avgViews - a.avgViews)[0] ?? null;
  const promisingHook = [...hookPerformance]
    .filter((hook) => hook.postCount <= 2 && hook.avgViews >= overallAvgViews)
    .sort((a, b) => b.avgViews - a.avgViews)[0] ?? null;
  const transcriptlessPosts = posts.filter((post) => !post.hasTranscript);
  const transcriptlessAvgViews =
    transcriptlessPosts.length > 0
      ? average(transcriptlessPosts.map((post) => post.views))
      : null;

  const doMoreOf: DashboardInsight[] = [];
  const doLessOf: DashboardInsight[] = [];
  const untappedOpportunities: DashboardInsight[] = [];

  if (themePerformance[0]) {
    doMoreOf.push({
      title: `${themePerformance[0].label} is carrying the period`,
      body: `This theme drove ${formatCompactNumber(themePerformance[0].totalViews)} views across ${themePerformance[0].postCount} posts, or ${formatPercent(themePerformance[0].shareOfViews * 100, 0)} of the total window.`,
    });
  }

  if (hookPerformance[0]) {
    doMoreOf.push({
      title: `${hookPerformance[0].label} is the strongest opener`,
      body: `Posts using this hook pattern averaged ${formatCompactNumber(hookPerformance[0].avgViews)} views across ${hookPerformance[0].postCount} posts.`,
    });
  }

  const saveHeavyTheme = [...themePerformance].sort((a, b) => b.avgSaves - a.avgSaves)[0] ?? null;
  if (saveHeavyTheme && saveHeavyTheme !== themePerformance[0]) {
    doMoreOf.push({
      title: `${saveHeavyTheme.label} earns strong save behavior`,
      body: `It averages ${formatCompactNumber(saveHeavyTheme.avgSaves)} saves and ${formatCompactNumber(saveHeavyTheme.avgShares)} shares per post, a sign people want to revisit or forward it.`,
    });
  }

  if (lowestTheme && lowestTheme.avgViews < overallAvgViews * 0.8) {
    doLessOf.push({
      title: `${lowestTheme.label} is trailing the rest of the mix`,
      body: `It averaged ${formatCompactNumber(lowestTheme.avgViews)} views across ${lowestTheme.postCount} posts versus ${formatCompactNumber(overallAvgViews)} overall.`,
    });
  }

  if (lowestHook && lowestHook.avgViews < overallAvgViews * 0.8) {
    doLessOf.push({
      title: `${lowestHook.label} needs a sharper first line`,
      body: `This hook pattern averaged ${formatCompactNumber(lowestHook.avgViews)} views, making it the weakest repeated opening format in the window.`,
    });
  }

  if (
    transcriptlessAvgViews !== null &&
    transcriptlessPosts.length > 0 &&
    transcriptlessAvgViews < overallAvgViews
  ) {
    doLessOf.push({
      title: "Posts without a clear spoken/text hook are lagging",
      body: `Posts missing transcript-backed hooks averaged ${formatCompactNumber(transcriptlessAvgViews)} views, below the ${formatCompactNumber(overallAvgViews)} account average.`,
    });
  }

  if (promisingTheme) {
    untappedOpportunities.push({
      title: `${promisingTheme.label} has upside with more volume`,
      body: `It averaged ${formatCompactNumber(promisingTheme.avgViews)} views while only showing up in ${promisingTheme.postCount} posts this period.`,
    });
  }

  if (promisingHook) {
    untappedOpportunities.push({
      title: `${promisingHook.label} deserves more repetitions`,
      body: `This hook type averaged ${formatCompactNumber(promisingHook.avgViews)} views but only appeared in ${promisingHook.postCount} posts.`,
    });
  }

  if (keywordPerformance[0]) {
    untappedOpportunities.push({
      title: "Repeat the strongest audience language earlier",
      body: `Keywords like “${keywordPerformance[0].keyword}” appeared in posts worth ${formatCompactNumber(keywordPerformance[0].totalViews)} total views, so that phrasing is worth bringing into hooks, covers, and captions.`,
    });
  }

  return {
    doMoreOf: doMoreOf.slice(0, 4),
    doLessOf: doLessOf.slice(0, 3),
    untappedOpportunities: untappedOpportunities.slice(0, 4),
  };
}

function buildNumberCallouts(input: {
  posts: DashboardPost[];
  totals: DashboardModel["totals"];
  themePerformance: DashboardThemePerformance[];
  hookPerformance: DashboardHookPerformance[];
  starPost: DashboardStarPost | null;
}) {
  const { posts, totals, themePerformance, hookPerformance, starPost } = input;
  const restPosts = starPost ? posts.filter((post) => post.title !== starPost.title) : posts;
  const averageWithoutStar =
    starPost && restPosts.length > 0 ? average(restPosts.map((post) => post.views)) : null;
  const topHook = hookPerformance[0];
  const dominantTheme = themePerformance[0];
  const coverage = posts.length > 0 ? posts.filter((post) => post.hasTranscript).length / posts.length : 0;

  const callouts: DashboardNumberCallout[] = [];

  if (starPost && totals.views > 0) {
    callouts.push({
      value: formatPercent((starPost.views / totals.views) * 100, 0),
      description: "of this 30-day window’s total views came from the top post.",
    });
  }

  if (dominantTheme) {
    callouts.push({
      value: formatPercent(dominantTheme.shareOfViews * 100, 0),
      description: `of total views came from ${dominantTheme.label}.`,
    });
  }

  if (averageWithoutStar !== null) {
    callouts.push({
      value: formatCompactNumber(averageWithoutStar),
      description: "average views per post after removing the top outlier.",
    });
  }

  if (topHook && totals.avgViews > 0) {
    callouts.push({
      value: `${round(topHook.avgViews / totals.avgViews, 1)}x`,
      description: `${topHook.label.replace(" Hook", "")} hooks versus the overall average view baseline.`,
    });
  } else {
    callouts.push({
      value: formatPercent(coverage * 100, 0),
      description: "of posts included a transcript-backed hook in this window.",
    });
  }

  return callouts.slice(0, 4);
}

export function formatCompactNumber(value: number) {
  if (value >= 1_000_000) {
    return `${round(value / 1_000_000, 1)}M`;
  }

  if (value >= 10_000) {
    return `${round(value / 1_000, 1)}K`;
  }

  if (value >= 1_000) {
    return `${Math.round(value / 100) / 10}K`;
  }

  return Math.round(value).toLocaleString("en-US");
}

export function formatPercent(value: number, precision = 1) {
  return `${round(value, precision)}%`;
}

export function buildDashboardModel(input: {
  account: LinkedInstagramAccountSummary | null;
  report: PrecomputedAnalysisReport;
  mediaItems: InstagramMediaListItem[];
}) {
  const mergedPosts = mergeReportMedia(input.report, input.mediaItems).sort((a, b) => {
    return b.views - a.views || (toDate(b.postedAt)?.getTime() ?? 0) - (toDate(a.postedAt)?.getTime() ?? 0);
  });

  const posts: DashboardPost[] = mergedPosts.map(({ storedTheme, hashtags, ...post }) => {
    void storedTheme;
    void hashtags;
    return post;
  });

  const totals = {
    views: input.report.aggregates.totals.views,
    reach: input.report.aggregates.totals.reach,
    likes: input.report.aggregates.totals.likes,
    saves: input.report.aggregates.totals.saves,
    shares: input.report.aggregates.totals.shares,
    postCount: input.report.aggregates.totals.postCount,
    avgViews:
      input.report.aggregates.totals.postCount > 0
        ? input.report.aggregates.totals.views / input.report.aggregates.totals.postCount
        : 0,
    avgEngagementRatePercent:
      typeof input.report.aggregates.totals.avgEngagementRate === "number"
        ? round(input.report.aggregates.totals.avgEngagementRate * 100, 1)
        : null,
  };

  const starPostSource = posts[0] ?? null;
  const avgWithoutStar =
    starPostSource && posts.length > 1
      ? average(posts.slice(1).map((post) => post.views))
      : null;
  const starPost = starPostSource
    ? {
        title: starPostSource.title,
        hook: starPostSource.hook,
        views: starPostSource.views,
        multiplier:
          avgWithoutStar && avgWithoutStar > 0 ? round(starPostSource.views / avgWithoutStar, 1) : null,
        theme: starPostSource.theme,
        permalink: starPostSource.permalink,
      }
    : null;

  const themePerformance = buildThemePerformance(posts, totals.views);
  const hookPerformance = buildHookPerformance(posts);
  const keywordPerformance = buildKeywordPerformance(posts);
  const hashtagPerformance = buildHashtagPerformance(
    mergedPosts.map((post) => ({
      caption: post.caption,
      views: post.views,
      hashtags: post.hashtags,
    })),
  );
  const strategicInsights = buildStrategicInsights({
    posts,
    totals,
    themePerformance,
    hookPerformance,
    keywordPerformance,
  });

  const username =
    input.account?.username ??
    input.report.accountSummary.username ??
    "instagram-account";

  return {
    username,
    title: `${username} | Instagram Insights`,
    windowLabel: buildWindowLabel(input.report),
    generatedAtLabel: formatDate(toDate(input.report.generatedAt) ?? new Date(), {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    postCountLabel: `${totals.postCount} ${totals.postCount === 1 ? "Post" : "Posts"}`,
    totals,
    statCards: [
      {
        label: "Total Views",
        value: totals.views,
        sublabel: `all ${totals.postCount} posts`,
        compact: true,
      },
      {
        label: "Total Reach",
        value: totals.reach,
        sublabel: "unique accounts",
        compact: true,
      },
      {
        label: "Total Likes",
        value: totals.likes,
        sublabel: "across period",
      },
      {
        label: "Total Saves",
        value: totals.saves,
        sublabel: "bookmarks",
      },
      {
        label: "Total Shares",
        value: totals.shares,
        sublabel: "sends + reposts",
      },
      {
        label: "Posts",
        value: totals.postCount,
        sublabel: `${input.report.window.days}-day window`,
      },
    ],
    starPost,
    themePerformance,
    hookPerformance,
    posts,
    keywordPerformance,
    hashtagPerformance,
    topHooks: posts.filter((post) => post.hook).slice(0, 5),
    performancePatterns: buildPerformancePatterns({
      themePerformance,
      hookPerformance,
      posts,
    }),
    hookGuidance: buildHookGuidance(hookPerformance),
    strategicInsights,
    numberCallouts: buildNumberCallouts({
      posts,
      totals,
      themePerformance,
      hookPerformance,
      starPost,
    }),
  } satisfies DashboardModel;
}
