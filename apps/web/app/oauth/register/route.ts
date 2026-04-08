import { registerMcpOAuthClient } from "@/lib/mcp-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
} as const;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await registerMcpOAuthClient(body);

    return Response.json(client, {
      status: 201,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid client registration.";

    return Response.json(
      {
        error: "invalid_client_metadata",
        error_description: message,
      },
      {
        status: 400,
        headers: CORS_HEADERS,
      },
    );
  }
}
