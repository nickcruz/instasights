import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildMediaListSearchParams } from "./media-query";
import { logRuntime } from "./output";
import { renderReportHtml } from "./report-html";
import { buildDashboardModel } from "./report-view-model";
import type {
  InstasightsApiClient,
} from "./api-client";
import type {
  MediaListResponse,
  ReportResponse,
} from "./types";

export type ReportClient = Pick<InstasightsApiClient, "getReport" | "listMedia">;

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "account";
}

function toDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatFileDate(value: string) {
  const parsed = toDate(value) ?? new Date();
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function assertSupportedReportDays(days: number) {
  if (days !== 30) {
    throw new Error("report generate currently supports only --days 30.");
  }
}

export function getReadyReport(response: ReportResponse) {
  if (response.status === "not_linked") {
    throw new Error(
      "No linked Instagram account found. Run `instasights instagram link --open` first.",
    );
  }

  if (response.status === "not_synced" || !response.report) {
    throw new Error(
      "No synced analysis report is available. Run `instasights sync run --wait` first.",
    );
  }

  return response.report;
}

export async function listAllReportMedia(input: {
  client: ReportClient;
  since: string;
  until: string;
  limit?: number;
}) {
  const items = new Map<string, MediaListResponse["items"][number]>();
  let cursor: string | null = null;
  let page = 1;

  while (true) {
    logRuntime("Fetching report media page...", {
      page,
      cursor,
    });

    const searchParams = buildMediaListSearchParams({
      limit: input.limit ?? 100,
      since: input.since,
      until: input.until,
      flatMetrics: true,
    });

    if (cursor) {
      searchParams.set("cursor", cursor);
    }

    const response = await input.client.listMedia(searchParams);

    for (const item of response.items) {
      items.set(item.id, item);
    }

    if (!response.nextCursor) {
      break;
    }

    cursor = response.nextCursor;
    page += 1;
  }

  return [...items.values()];
}

export function buildDefaultReportOutputPath(input: {
  cwd?: string;
  username: string | null | undefined;
  generatedAt: string;
  days: number;
}) {
  const filename = `instagram-report-${slugify(input.username ?? "account")}-${input.days}d-${formatFileDate(
    input.generatedAt,
  )}.html`;

  return path.resolve(input.cwd ?? process.cwd(), filename);
}

export async function generateHtmlReport(input: {
  client: ReportClient;
  days?: number;
  outputPath?: string | null;
  cwd?: string;
}) {
  const days = input.days ?? 30;
  assertSupportedReportDays(days);

  logRuntime("Generating the HTML report...", { days });
  logRuntime("Fetching the precomputed analysis report payload...");
  const reportResponse = await input.client.getReport(days);
  const report = getReadyReport(reportResponse);
  logRuntime("Fetching media needed to enrich the HTML report...");
  const mediaItems = await listAllReportMedia({
    client: input.client,
    since: report.window.since,
    until: report.window.until,
  });
  const model = buildDashboardModel({
    account: reportResponse.account,
    report,
    mediaItems,
  });
  logRuntime("Rendering report HTML in memory...", {
    postCount: model.posts.length,
  });
  const html = renderReportHtml(model);
  const resolvedOutputPath = input.outputPath
    ? path.resolve(input.cwd ?? process.cwd(), input.outputPath)
    : buildDefaultReportOutputPath({
        cwd: input.cwd,
        username: model.username,
        generatedAt: report.generatedAt,
        days,
      });

  logRuntime("Writing the HTML report to disk...", {
    outputPath: resolvedOutputPath,
  });
  await mkdir(path.dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, `${html}\n`, "utf8");

  return {
    outputPath: resolvedOutputPath,
    days,
    username: model.username,
    generatedAt: report.generatedAt,
    postCount: model.posts.length,
  };
}
