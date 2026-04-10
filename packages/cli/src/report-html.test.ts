import assert from "node:assert/strict";
import test from "node:test";

import {
  makeFixtureAccount,
  makeFixtureMediaItems,
  makeFixtureReport,
} from "./report-fixtures";
import { renderReportHtml } from "./report-html";
import { buildDashboardModel } from "./report-view-model";

test("renderReportHtml includes the dashboard tabs and escapes post content", () => {
  const model = buildDashboardModel({
    account: makeFixtureAccount(),
    report: makeFixtureReport(),
    mediaItems: makeFixtureMediaItems(),
  });
  const html = renderReportHtml(model);

  assert.match(html, /Overview/);
  assert.match(html, /All Posts/);
  assert.match(html, /Keywords/);
  assert.match(html, /Hook Patterns/);
  assert.match(html, /Strategic Insights/);
  assert.match(html, /Caption Keywords by Total Views/);
  assert.match(html, /\\u003cscript\\u003ealert\(1\)\\u003c\/script\\u003e/);
  assert.match(html, /const POSTS =/);
});
