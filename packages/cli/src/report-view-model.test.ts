import assert from "node:assert/strict";
import test from "node:test";

import {
  makeFixtureAccount,
  makeFixtureMediaItems,
  makeFixtureReport,
} from "./report-fixtures";
import {
  buildDashboardModel,
  buildHashtagPerformance,
  buildKeywordPerformance,
  buildWindowLabel,
  classifyHookType,
} from "./report-view-model";

test("classifyHookType applies deterministic precedence", () => {
  assert.equal(
    classifyHookType({
      hook: "Save $60,000 on taxes with one decision.",
    }),
    "Number/Stat Hook",
  );

  assert.equal(
    classifyHookType({
      hook: "If you and your partner build strategically, you can grow faster.",
    }),
    "Question/Challenge Hook",
  );

  assert.equal(
    classifyHookType({
      hook: "I burned out twice building my first company.",
    }),
    "Personal Story Hook",
  );

  assert.equal(
    classifyHookType({
      hook: "Practical systems help founders move faster.",
    }),
    "Statement Hook",
  );
});

test("keyword and hashtag performance use weighted totals", () => {
  const keywords = buildKeywordPerformance([
    {
      caption: "personal finance for couples and real estate strategy",
      views: 12000,
    },
    {
      caption: "real estate for founders and personal finance systems",
      views: 8000,
    },
    {
      caption: "Claude workflow for founders",
      views: 2000,
    },
  ]);
  const hashtags = buildHashtagPerformance([
    {
      caption: "finance caption #money #taxes",
      hashtags: ["money", "taxes"],
      views: 12000,
    },
    {
      caption: "more finance #money",
      hashtags: ["money"],
      views: 8000,
    },
  ]);

  assert.equal(keywords[0]?.keyword, "personal finance");
  assert.equal(keywords[0]?.totalViews, 20000);
  assert.deepEqual(hashtags[0], {
    hashtag: "money",
    totalViews: 20000,
    postCount: 2,
  });
});

test("buildDashboardModel derives presentation themes and strategic sections", () => {
  const report = makeFixtureReport();
  const model = buildDashboardModel({
    account: makeFixtureAccount(),
    report,
    mediaItems: makeFixtureMediaItems(),
  });

  assert.equal(buildWindowLabel(report), "Mar 11 – Apr 10, 2026");
  assert.equal(model.title, "creator | Instagram Insights");
  assert.equal(model.posts[0]?.theme, "Oversharing Our Finances");
  assert.equal(model.posts.find((post) => post.id === "post-4")?.theme, "Founder / Builder");
  assert.equal(model.starPost?.views, 18000);
  assert.equal(model.hookPerformance[0]?.label, "Number/Stat Hook");
  assert.ok(model.keywordPerformance.some((item) => item.keyword.includes("oversharing")));
  assert.ok(model.strategicInsights.doMoreOf.length > 0);
  assert.ok(model.numberCallouts.length > 0);
});
