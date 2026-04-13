import assert from "node:assert/strict";
import test from "node:test";

import { makeFixtureReportResponse } from "./report-fixtures";
import { paginateReportResponse } from "./report-pagination";

test("paginateReportResponse slices report arrays and adds pagination metadata", () => {
  const response = makeFixtureReportResponse();
  const result = paginateReportResponse(response, 2, 1);

  assert.equal(result.report?.posts.length, 1);
  assert.equal(result.pagination.posts.page, 2);
  assert.equal(result.pagination.posts.pageSize, 1);
  assert.equal(result.pagination.posts.totalItems, response.report?.posts.length);
  assert.equal(result.pagination.posts.hasPreviousPage, true);
  assert.equal(result.pagination.posts.previousPage, 1);

  assert.ok((result.report?.aggregates.hashtags.length ?? 0) <= 1);
  assert.equal(
    result.pagination.hashtags.page,
    Math.min(2, result.pagination.hashtags.totalPages),
  );

  assert.ok((result.report?.aggregates.themeAverages.length ?? 0) <= 1);
  assert.equal(
    result.pagination.themeAverages.page,
    Math.min(2, result.pagination.themeAverages.totalPages),
  );

  const likesPage = result.report?.aggregates.topPostsByMetric.likes ?? [];
  assert.ok(likesPage.length <= 1);
  if (result.pagination.topPostsByMetric.likes) {
    assert.equal(result.pagination.topPostsByMetric.likes.page, 1);
  }
});

test("paginateReportResponse clamps out-of-range pages", () => {
  const response = makeFixtureReportResponse();
  const result = paginateReportResponse(response, 999, 2);

  assert.equal(result.pagination.posts.page, result.pagination.posts.totalPages);
  assert.equal(result.pagination.posts.hasNextPage, false);
});
