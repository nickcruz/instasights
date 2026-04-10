import assert from "node:assert/strict";
import test from "node:test";

import type { InstagramMediaDetail } from "@instagram-insights/contracts";

import {
  ANALYSIS_VERSION,
  buildPrecomputedAnalysisReport,
  buildPrecomputedMediaAnalysis,
  extractHashtags,
  extractTheme,
} from "@/lib/precomputed-analysis";

function makeMedia(overrides: Partial<InstagramMediaDetail> = {}): InstagramMediaDetail {
  return {
    id: "media-1",
    instagramAccountId: "acct-1",
    lastSyncRunId: "sync-1",
    caption: "Hooks matter. #Growth #Hooks",
    commentsCount: 6,
    likeCount: 10,
    mediaProductType: "REELS",
    mediaType: "VIDEO",
    mediaUrl: null,
    thumbnailUrl: "https://example.com/thumb.jpg",
    previewUrl: null,
    permalink: "https://instagram.com/p/123",
    shortcode: null,
    postedAt: "2026-04-09T12:00:00.000Z",
    username: "creator",
    isCommentEnabled: true,
    transcriptStatus: "completed",
    transcriptText: "Hooks win attention fast. Repeat the strongest idea early.",
    transcriptLanguage: "en",
    transcriptModel: "base",
    transcriptClipSeconds: 30,
    transcriptError: null,
    transcriptMetadata: null,
    transcriptUpdatedAt: "2026-04-09T12:05:00.000Z",
    transcript: undefined,
    hook: undefined,
    theme: undefined,
    hashtags: undefined,
    views: undefined,
    reach: undefined,
    likes: undefined,
    saves: undefined,
    shares: undefined,
    comments: undefined,
    engagementRate: undefined,
    analysisVersion: undefined,
    topComments: null,
    insights: {
      metrics: {
        reach: { values: [{ value: 50 }] },
        views: { values: [{ value: 80 }] },
        saved: { values: [{ value: 4 }] },
        shares: { values: [{ value: 2 }] },
        likes: { values: [{ value: 10 }] },
        comments: { values: [{ value: 6 }] },
      },
    },
    warnings: null,
    errors: null,
    raw: null,
    syncedAt: "2026-04-09T12:05:00.000Z",
    createdAt: "2026-04-09T12:05:00.000Z",
    updatedAt: "2026-04-09T12:05:00.000Z",
    ...overrides,
  };
}

test("extractHashtags normalizes and de-duplicates hashtags", () => {
  assert.deepEqual(extractHashtags("Test #Growth #growth #Hooks"), [
    "growth",
    "hooks",
  ]);
});

test("extractTheme prefers the most frequent meaningful keyword", () => {
  assert.equal(
    extractTheme({
      caption: "Story systems build story habits",
      transcript: "Systems help every story become repeatable",
    }),
    "story",
  );
});

test("buildPrecomputedMediaAnalysis flattens metrics and derives hook", () => {
  const analysis = buildPrecomputedMediaAnalysis(makeMedia());

  assert.equal(analysis.analysisVersion, ANALYSIS_VERSION);
  assert.equal(analysis.hook, "Hooks win attention fast.");
  assert.deepEqual(analysis.hashtags, ["growth", "hooks"]);
  assert.equal(analysis.views, 80);
  assert.equal(analysis.reach, 50);
  assert.equal(analysis.saves, 4);
  assert.equal(analysis.shares, 2);
  assert.equal(analysis.comments, 6);
  assert.equal(analysis.likes, 10);
  assert.equal(analysis.engagementRate, 0.44);
});

test("buildPrecomputedMediaAnalysis returns null engagementRate when reach is zero", () => {
  const analysis = buildPrecomputedMediaAnalysis(
    makeMedia({
      insights: {
        metrics: {
          reach: { values: [{ value: 0 }] },
        },
      },
    }),
  );

  assert.equal(analysis.engagementRate, null);
});

test("buildPrecomputedAnalysisReport filters to the trailing 30 days and aggregates posts", () => {
  const report = buildPrecomputedAnalysisReport({
    account: {
      username: "creator",
      followers_count: 1000,
      follows_count: 200,
      biography: "Helping creators ship",
      website: "https://example.com",
      profile_picture_url: "https://example.com/avatar.jpg",
    },
    mediaRows: [
      makeMedia(),
      makeMedia({
        id: "media-2",
        postedAt: "2026-03-01T12:00:00.000Z",
      }),
      makeMedia({
        id: "media-3",
        caption: "Content systems. #systems",
        transcriptText: null,
        commentsCount: 2,
        likeCount: 5,
        insights: {
          metrics: {
            reach: { total_value: { value: 20 } },
            views: { values: [{ value: 30 }] },
            saved: { values: [{ value: 1 }] },
            shares: { values: [{ value: 1 }] },
          },
        },
      }),
    ],
    generatedAt: new Date("2026-04-10T12:00:00.000Z"),
  });

  assert.equal(report.window.days, 30);
  assert.equal(report.posts.length, 2);
  assert.equal(report.accountSummary.followers, 1000);
  assert.equal(report.aggregates.totals.postCount, 2);
  assert.equal(report.aggregates.topPostsByMetric.views[0]?.id, "media-1");
  assert.equal(report.aggregates.hashtags[0]?.hashtag, "growth");
  assert.equal(report.aggregates.themeAverages.length, 2);
});
