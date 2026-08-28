import type { TranscriptionRequest } from "@instasights/contracts";

import { getRequiredEnv } from "@/lib/env";
import { runTranscriptionJob } from "@/lib/server/transcription-job";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function validateRequest(payload: unknown): TranscriptionRequest | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as Partial<TranscriptionRequest>;

  if (
    typeof value.mediaId !== "string" ||
    !value.mediaId ||
    typeof value.mediaUrl !== "string" ||
    !value.mediaUrl
  ) {
    return null;
  }

  if (
    value.maxSeconds !== undefined &&
    (typeof value.maxSeconds !== "number" || !Number.isFinite(value.maxSeconds) || value.maxSeconds <= 0)
  ) {
    return null;
  }

  return value as TranscriptionRequest;
}

export async function POST(request: Request) {
  const expectedKey = getRequiredEnv("INTERNAL_TRANSCRIBER_API_KEY");
  const actualKey = request.headers.get("x-internal-transcriber-key");

  if (!actualKey || actualKey !== expectedKey) {
    return unauthorized();
  }

  const payload = validateRequest(await request.json().catch(() => null));

  if (!payload) {
    return Response.json({ error: "Invalid transcription payload." }, { status: 400 });
  }

  const response = await runTranscriptionJob({
    mediaId: payload.mediaId,
    mediaUrl: payload.mediaUrl,
    maxSeconds: payload.maxSeconds ?? 30,
  });

  return Response.json(response);
}
