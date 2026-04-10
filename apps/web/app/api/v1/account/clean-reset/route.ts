import { cleanResetInstagramStateByUserId } from "@instagram-insights/db";

import {
  createJsonResponse,
  requireApiAccess,
} from "@/lib/developer-api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authResult = await requireApiAccess(request);

  if (!authResult.ok) {
    return authResult.response;
  }

  return createJsonResponse(
    await cleanResetInstagramStateByUserId(authResult.auth.userId),
  );
}
