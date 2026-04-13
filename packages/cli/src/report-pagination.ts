import type { ReportResponse } from "./types";

type PaginationSummary = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
  startIndex: number;
  endIndex: number;
};

type PaginatedList<T> = {
  items: T[];
  pagination: PaginationSummary;
};

export type PaginatedReportResponse = ReportResponse & {
  pagination: {
    posts: PaginationSummary;
    hashtags: PaginationSummary;
    themeAverages: PaginationSummary;
    topPostsByMetric: Record<string, PaginationSummary>;
  };
};

type ReportPost = NonNullable<ReportResponse["report"]>["posts"][number];
type ReportHashtag = NonNullable<ReportResponse["report"]>["aggregates"]["hashtags"][number];
type ReportThemeAverage =
  NonNullable<ReportResponse["report"]>["aggregates"]["themeAverages"][number];

function buildPaginationSummary(totalItems: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const normalizedPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = totalItems === 0 ? 0 : (normalizedPage - 1) * pageSize;
  const endIndex = totalItems === 0 ? 0 : Math.min(startIndex + pageSize, totalItems);

  return {
    page: normalizedPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: normalizedPage < totalPages,
    hasPreviousPage: normalizedPage > 1,
    nextPage: normalizedPage < totalPages ? normalizedPage + 1 : null,
    previousPage: normalizedPage > 1 ? normalizedPage - 1 : null,
    startIndex,
    endIndex,
  } satisfies PaginationSummary;
}

function paginateList<T>(items: T[], page: number, pageSize: number): PaginatedList<T> {
  const pagination = buildPaginationSummary(items.length, page, pageSize);
  return {
    items: items.slice(pagination.startIndex, pagination.endIndex),
    pagination,
  };
}

export function paginateReportResponse(
  response: ReportResponse,
  page: number,
  pageSize: number,
): PaginatedReportResponse {
  if (!response.report) {
    return {
      ...response,
      pagination: {
        posts: buildPaginationSummary(0, page, pageSize),
        hashtags: buildPaginationSummary(0, page, pageSize),
        themeAverages: buildPaginationSummary(0, page, pageSize),
        topPostsByMetric: {},
      },
    };
  }

  const paginatedPosts = paginateList<ReportPost>(response.report.posts, page, pageSize);
  const paginatedHashtags = paginateList<ReportHashtag>(
    response.report.aggregates.hashtags,
    page,
    pageSize,
  );
  const paginatedThemeAverages = paginateList<ReportThemeAverage>(
    response.report.aggregates.themeAverages,
    page,
    pageSize,
  );

  const topPostsByMetric = Object.fromEntries(
    Object.entries(response.report.aggregates.topPostsByMetric).map(([metric, posts]) => {
      const paginated = paginateList(posts, page, pageSize);
      return [metric, paginated.items];
    }),
  );

  const topPostsByMetricPagination = Object.fromEntries(
    Object.entries(response.report.aggregates.topPostsByMetric).map(([metric, posts]) => {
      const paginated = paginateList(posts, page, pageSize);
      return [metric, paginated.pagination];
    }),
  );

  return {
    ...response,
    report: {
      ...response.report,
      posts: paginatedPosts.items,
      aggregates: {
        ...response.report.aggregates,
        hashtags: paginatedHashtags.items,
        themeAverages: paginatedThemeAverages.items,
        topPostsByMetric,
      },
    },
    pagination: {
      posts: paginatedPosts.pagination,
      hashtags: paginatedHashtags.pagination,
      themeAverages: paginatedThemeAverages.pagination,
      topPostsByMetric: topPostsByMetricPagination,
    },
  };
}
