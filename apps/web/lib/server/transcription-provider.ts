import { getEnv, getRequiredEnv } from "@/lib/env";

const DEFAULT_SONIOX_API_BASE_URL = "https://api.soniox.com";
const DEFAULT_SONIOX_MODEL = "stt-async-v4";
const POLL_INTERVAL_MS = 1_500;
const MAX_POLL_ATTEMPTS = 40;

type SonioxToken = {
  text?: string;
};

function getSonioxConfig() {
  return {
    apiKey: getRequiredEnv("SONIOX_API_KEY"),
    model: getEnv("SONIOX_TRANSCRIPTION_MODEL") ?? DEFAULT_SONIOX_MODEL,
    baseUrl: getEnv("SONIOX_API_BASE_URL") ?? DEFAULT_SONIOX_API_BASE_URL,
  };
}

async function sonioxRequest(path: string, init: RequestInit = {}) {
  const config = getSonioxConfig();
  const response = await fetch(new URL(path, config.baseUrl), {
    ...init,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null;
    throw new Error(
      payload?.error ?? payload?.message ?? `Soniox request failed with status ${response.status}.`,
    );
  }

  return response;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function transcribeAudioWithSoniox(input: {
  wavBuffer: Buffer;
  fileName: string;
  languageHints?: string[];
}) {
  const config = getSonioxConfig();

  const formData = new FormData();
  const bytes = new Uint8Array(input.wavBuffer);
  formData.set("file", new Blob([bytes], { type: "audio/wav" }), input.fileName);

  const uploadResponse = await sonioxRequest("/v1/files", {
    method: "POST",
    body: formData,
  });
  const uploadPayload = (await uploadResponse.json()) as { id?: string };

  if (!uploadPayload.id) {
    throw new Error("Soniox did not return a file id.");
  }

  const transcriptionResponse = await sonioxRequest("/v1/transcriptions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      file_id: uploadPayload.id,
      model: config.model,
      language_hints: input.languageHints ?? ["en"],
    }),
  });
  const transcriptionPayload = (await transcriptionResponse.json()) as { id?: string };

  if (!transcriptionPayload.id) {
    throw new Error("Soniox did not return a transcription id.");
  }

  let finalStatus = "queued";

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const statusResponse = await sonioxRequest(
      `/v1/transcriptions/${transcriptionPayload.id}`,
      { method: "GET" },
    );
    const statusPayload = (await statusResponse.json()) as {
      status?: string;
      error?: string;
    };

    finalStatus = statusPayload.status ?? "unknown";

    if (finalStatus === "completed") {
      break;
    }

    if (finalStatus === "error") {
      throw new Error(statusPayload.error ?? "Soniox transcription failed.");
    }

    await delay(POLL_INTERVAL_MS);
  }

  if (finalStatus !== "completed") {
    throw new Error("Soniox transcription polling timed out.");
  }

  const transcriptResponse = await sonioxRequest(
    `/v1/transcriptions/${transcriptionPayload.id}/transcript`,
    { method: "GET" },
  );
  const transcriptPayload = (await transcriptResponse.json()) as {
    tokens?: SonioxToken[];
    language?: string;
  };

  const transcriptText = (transcriptPayload.tokens ?? [])
    .map((token) => token.text ?? "")
    .join("")
    .trim();

  return {
    transcriptText,
    language: transcriptPayload.language ?? null,
    model: config.model,
  };
}
