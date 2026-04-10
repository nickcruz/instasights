import { getLatestAnalysisReportByUserId } from "@instagram-insights/db";

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
  const daysParam = url.searchParams.get("days");
  const days = daysParam ? Number.parseInt(daysParam, 10) : 30;

  if (days !== 30) {
    return createJsonResponse(
      {
        error: "Unsupported report window.",
        supportedDays: [30],
      },
      { status: 400 },
    );
  }

  return createJsonResponse(
    await getLatestAnalysisReportByUserId({
      userId: authResult.auth.userId,
      reportKey: "30d",
    }),
  );
}
