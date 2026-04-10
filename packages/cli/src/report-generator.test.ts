import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  makeFixtureMediaItems,
  makeFixtureReportResponse,
} from "./report-fixtures";
import {
  buildDefaultReportOutputPath,
  generateHtmlReport,
} from "./report-generator";

test("buildDefaultReportOutputPath uses the username and generated date", () => {
  const outputPath = buildDefaultReportOutputPath({
    cwd: "/tmp/example",
    username: "Creator Account",
    generatedAt: "2026-04-10T12:00:00.000Z",
    days: 30,
  });

  assert.equal(
    outputPath,
    path.resolve("/tmp/example", "instagram-insights-report-creator-account-30d-20260410.html"),
  );
});

test("generateHtmlReport paginates media, writes HTML, and honors the default path", async (t) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "instagram-report-"));
  t.after(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  const mediaItems = makeFixtureMediaItems();
  const pages = [
    {
      items: mediaItems.slice(0, 2),
      nextCursor: "page-2",
    },
    {
      items: mediaItems.slice(2),
      nextCursor: null,
    },
  ];
  const calls: string[] = [];
  const client = {
    async getReport() {
      return makeFixtureReportResponse();
    },
    async listMedia(searchParams: URLSearchParams) {
      calls.push(searchParams.toString());
      const cursor = searchParams.get("cursor");
      return cursor === "page-2" ? pages[1] : pages[0];
    },
  };

  const result = await generateHtmlReport({
    client,
    cwd: tempRoot,
  });
  const html = await readFile(result.outputPath, "utf8");

  assert.match(result.outputPath, /instagram-insights-report-creator-30d-20260410\.html$/);
  assert.equal(calls.length, 2);
  assert.equal(new URLSearchParams(calls[0]).get("flatMetrics"), "true");
  assert.equal(new URLSearchParams(calls[1]).get("cursor"), "page-2");
  assert.match(html, /creator \| Instagram Insights/);
  assert.match(html, /Star Post/);
});

test("generateHtmlReport honors an explicit output path", async (t) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "instagram-report-explicit-"));
  t.after(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  const client = {
    async getReport() {
      return makeFixtureReportResponse();
    },
    async listMedia() {
      return {
        items: makeFixtureMediaItems(),
        nextCursor: null,
      };
    },
  };

  const result = await generateHtmlReport({
    client,
    cwd: tempRoot,
    outputPath: "reports/custom-report.html",
  });

  assert.equal(result.outputPath, path.resolve(tempRoot, "reports/custom-report.html"));
});

test("generateHtmlReport rejects unsupported days and unavailable reports", async () => {
  await assert.rejects(
    generateHtmlReport({
      client: {
        async getReport() {
          return makeFixtureReportResponse();
        },
        async listMedia() {
          return {
            items: [],
            nextCursor: null,
          };
        },
      },
      days: 14,
    }),
    /supports only --days 30/,
  );

  await assert.rejects(
    generateHtmlReport({
      client: {
        async getReport() {
          return {
            status: "not_synced" as const,
            account: null,
            latestSyncRun: null,
            report: null,
          };
        },
        async listMedia() {
          return {
            items: [],
            nextCursor: null,
          };
        },
      },
    }),
    /sync run --wait/,
  );
});
