import {
  createDeveloperApiKey,
  getInstagramAccountByUserId,
  listDeveloperApiKeySummariesByUserId,
} from "@instagram-insights/db";

import { auth } from "@/lib/auth";
import { createJsonResponse } from "@/lib/developer-api-auth";
import { generateDeveloperApiKey } from "@/lib/developer-api-keys";
import { getPostHogClient } from "@/lib/posthog-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!session || !userId) {
    return createJsonResponse(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const keys = await listDeveloperApiKeySummariesByUserId(userId);
  return createJsonResponse({ keys });
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!session || !userId) {
    return createJsonResponse(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const instagramAccount = await getInstagramAccountByUserId(userId);

  if (!instagramAccount) {
    return createJsonResponse(
      {
        error:
          "Link an Instagram account before creating API keys for developer access.",
      },
      { status: 400 },
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | { name?: unknown }
    | null;
  const name =
    typeof payload?.name === "string" ? payload.name.trim() : "Default key";

  if (!name) {
    return createJsonResponse(
      { error: "API key name is required." },
      { status: 400 },
    );
  }

  const generatedKey = generateDeveloperApiKey();
  const createdKey = await createDeveloperApiKey({
    userId,
    name,
    keyPrefix: generatedKey.keyPrefix,
    secretHash: generatedKey.secretHash,
  });

  const keys = await listDeveloperApiKeySummariesByUserId(userId);
  const key = keys.find((item) => item.id === createdKey.id) ?? null;

  getPostHogClient().capture({
    distinctId: userId,
    event: "developer_api_key_created_server",
    properties: { key_name: name, key_prefix: generatedKey.keyPrefix },
  });

  return createJsonResponse(
    {
      apiKey: generatedKey.apiKey,
      key,
    },
    { status: 201 },
  );
}
