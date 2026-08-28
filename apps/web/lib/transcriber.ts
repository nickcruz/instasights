import type {
  TranscriptionRequest,
  TranscriptionResponse,
} from "@instasights/contracts";

import { getEnv, getRequiredEnv } from "@/lib/env";

const INTERNAL_TRANSCRIBER_PATH = "/api/internal/transcriptions";

export const DEFAULT_TRANSCRIBER_MAX_SECONDS = 30;
export const DEFAULT_TRANSCRIBER_CONCURRENCY = 1;
const TRANSCRIBER_RETRY_DELAYS_MS = [250, 750];

export type InstagramMediaForTranscription = {
  id: string;
  mediaType: string | null;
  mediaUrl: string | null;
  transcriptStatus: string | null;
};

export function normalizeTranscriberMaxSeconds(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_TRANSCRIBER_MAX_SECONDS;
  }

  return parsed;
}

export function resolveTranscriberMaxSeconds() {
  return normalizeTranscriberMaxSeconds(getEnv("TRANSCRIBER_DEFAULT_MAX_SECONDS"));
}

export function isTranscriberConfigured() {
  return Boolean(getEnv("INTERNAL_TRANSCRIBER_API_KEY") && getEnv("SONIOX_API_KEY"));
}

export function isInstagramMediaEligibleForTranscription(
  media: InstagramMediaForTranscription,
) {
  return (
    media.mediaType?.toUpperCase() === "VIDEO" &&
    Boolean(media.mediaUrl) &&
    media.transcriptStatus !== "completed"
  );
}

export function chunkTranscriptionItems<T>(items: T[], chunkSize: number) {
  const normalizedChunkSize = Math.max(1, chunkSize);
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += normalizedChunkSize) {
    chunks.push(items.slice(index, index + normalizedChunkSize));
  }

  return chunks;
}

export function buildTranscriptMetadata(input: {
  mediaUrl: string;
  requestedMaxSeconds: number;
  response: Pick<TranscriptionResponse, "clipSeconds" | "truncated" | "status">;
}) {
  return {
    mediaUrl: input.mediaUrl,
    requestedMaxSeconds: input.requestedMaxSeconds,
    clipSeconds: input.response.clipSeconds,
    truncated: input.response.truncated,
    serviceStatus: input.response.status,
  } satisfies Record<string, unknown>;
}

function buildTranscriberEndpoint(baseUrl: string) {
  return new URL(INTERNAL_TRANSCRIBER_PATH, baseUrl);
}

function resolveAppUrl() {
  return (
    getEnv("APP_URL") ??
    getEnv("INSTAGRAM_APP_URL") ??
    "http://localhost:3000"
  );
}

function getTranscriberConfig() {
  return {
    appUrl: resolveAppUrl(),
    apiKey: getRequiredEnv("INTERNAL_TRANSCRIBER_API_KEY"),
  };
}

function shouldRetryTranscriberRequest(status: number) {
  return status >= 500 && status < 600;
}

async function sleep(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isTranscriptionResponse(
  payload: Partial<TranscriptionResponse> | { error?: string } | null,
): payload is TranscriptionResponse {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  return Boolean(
    "mediaId" in payload &&
      typeof payload.mediaId === "string" &&
      "model" in payload &&
      typeof payload.model === "string" &&
      "clipSeconds" in payload &&
      typeof payload.clipSeconds === "number" &&
      "truncated" in payload &&
      typeof payload.truncated === "boolean" &&
      "status" in payload &&
      (payload.status === "completed" || payload.status === "failed"),
  );
}

export async function transcribeInstagramMedia(
  request: TranscriptionRequest,
): Promise<TranscriptionResponse> {
  const config = getTranscriberConfig();
  const endpoint = buildTranscriberEndpoint(config.appUrl);

  for (let attempt = 0; attempt <= TRANSCRIBER_RETRY_DELAYS_MS.length; attempt += 1) {
    const response = await fetch(endpoint, {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        "x-internal-transcriber-key": config.apiKey,
      },
      body: JSON.stringify(request),
    });

    const payload = (await response.json().catch(() => null)) as
      | Partial<TranscriptionResponse>
      | { error?: string }
      | null;

    if (response.ok) {
      if (!isTranscriptionResponse(payload)) {
        throw new Error("Transcriber service returned an invalid response.");
      }

      return payload;
    }

    const isRetryable =
      shouldRetryTranscriberRequest(response.status) &&
      attempt < TRANSCRIBER_RETRY_DELAYS_MS.length;

    if (isRetryable) {
      await sleep(TRANSCRIBER_RETRY_DELAYS_MS[attempt]!);
      continue;
    }

    throw new Error(
      payload && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `Transcriber request failed with status ${response.status}.`,
    );
  }

  throw new Error("Transcriber request exhausted retries.");
}
