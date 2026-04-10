export function resolveDaysToSinceIso(days: number, now = new Date()) {
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return since.toISOString();
}

export function buildMediaListSearchParams(input: {
  limit?: number;
  mediaType?: string;
  since?: string;
  until?: string;
  days?: number;
  flatMetrics?: boolean;
  now?: Date;
}) {
  const searchParams = new URLSearchParams();

  if (input.limit) {
    searchParams.set("limit", String(input.limit));
  }

  if (input.mediaType) {
    searchParams.set("mediaType", input.mediaType);
  }

  if (input.days) {
    searchParams.set("since", resolveDaysToSinceIso(input.days, input.now));
  }

  if (input.since) {
    searchParams.set("since", input.since);
  }

  if (input.until) {
    searchParams.set("until", input.until);
  }

  if (input.flatMetrics) {
    searchParams.set("flatMetrics", "true");
  }

  return searchParams;
}
