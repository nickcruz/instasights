import { buildProtectedResourceMetadata } from "@/lib/mcp-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return Response.json(buildProtectedResourceMetadata(request), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
