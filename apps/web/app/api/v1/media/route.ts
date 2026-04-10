import { listInstagramMediaByUserId } from "@instagram-insights/db";

import {
  createJsonResponse,
  requireApiAccess,
} from "@/lib/developer-api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authResult = await requireApiAccess(request);

  if (!authResult.ok) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const limit = url.searchParams.get("limit");
  const mediaType = url.searchParams.get("mediaType");
  const cursor = url.searchParams.get("cursor");
  const since = url.searchParams.get("since");
  const until = url.searchParams.get("until");
  const flatMetrics = url.searchParams.get("flatMetrics");

  return createJsonResponse(
    await listInstagramMediaByUserId({
      userId: authResult.auth.userId,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      mediaType,
      cursor,
      since,
      until,
      includeFlatMetrics: flatMetrics === "true",
    }),
  );
}
