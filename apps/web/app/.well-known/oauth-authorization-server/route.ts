import { buildAuthorizationServerMetadata } from "@/lib/mcp-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return Response.json(buildAuthorizationServerMetadata(request), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
