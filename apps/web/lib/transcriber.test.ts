import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTranscriptMetadata,
  chunkTranscriptionItems,
  DEFAULT_TRANSCRIBER_CONCURRENCY,
  DEFAULT_TRANSCRIBER_MAX_SECONDS,
  isInstagramMediaEligibleForTranscription,
  normalizeTranscriberMaxSeconds,
  transcribeInstagramMedia,
} from "@/lib/transcriber";

test("default transcriber concurrency is one request at a time", () => {
  assert.equal(DEFAULT_TRANSCRIBER_CONCURRENCY, 1);
});

test("normalizeTranscriberMaxSeconds falls back for missing and invalid values", () => {
  assert.equal(
    normalizeTranscriberMaxSeconds(undefined),
    DEFAULT_TRANSCRIBER_MAX_SECONDS,
  );
  assert.equal(
    normalizeTranscriberMaxSeconds("not-a-number"),
    DEFAULT_TRANSCRIBER_MAX_SECONDS,
  );
  assert.equal(
    normalizeTranscriberMaxSeconds("-5"),
    DEFAULT_TRANSCRIBER_MAX_SECONDS,
  );
});

test("normalizeTranscriberMaxSeconds accepts positive integers", () => {
  assert.equal(normalizeTranscriberMaxSeconds("45"), 45);
});

test("isInstagramMediaEligibleForTranscription only accepts unfinished video rows", () => {
  assert.equal(
    isInstagramMediaEligibleForTranscription({
      id: "video-1",
      mediaType: "VIDEO",
      mediaUrl: "https://example.com/video.mp4",
      transcriptStatus: null,
    }),
    true,
  );

  assert.equal(
    isInstagramMediaEligibleForTranscription({
      id: "image-1",
      mediaType: "IMAGE",
      mediaUrl: "https://example.com/image.jpg",
      transcriptStatus: null,
    }),
    false,
  );

  assert.equal(
    isInstagramMediaEligibleForTranscription({
      id: "video-2",
      mediaType: "VIDEO",
      mediaUrl: "https://example.com/video.mp4",
      transcriptStatus: "completed",
    }),
    false,
  );
});

test("chunkTranscriptionItems creates bounded concurrency batches", () => {
  assert.deepEqual(chunkTranscriptionItems([1, 2, 3, 4, 5], 2), [
    [1, 2],
    [3, 4],
    [5],
  ]);
});

test("buildTranscriptMetadata captures the persisted response details", () => {
  assert.deepEqual(
    buildTranscriptMetadata({
      mediaUrl: "https://example.com/video.mp4",
      requestedMaxSeconds: 30,
      response: {
        clipSeconds: 27,
        truncated: false,
        status: "completed",
      },
    }),
    {
      mediaUrl: "https://example.com/video.mp4",
      requestedMaxSeconds: 30,
      clipSeconds: 27,
      truncated: false,
      serviceStatus: "completed",
    },
  );
});

test("transcribeInstagramMedia retries transient 503 responses", async (t) => {
  process.env.APP_URL = "https://instasights.example.com";
  process.env.INTERNAL_TRANSCRIBER_API_KEY = "test-key";

  let attempts = 0;
  const originalFetch = globalThis.fetch;
  const originalSetTimeout = globalThis.setTimeout;

  globalThis.setTimeout = ((callback: (...args: never[]) => void) => {
    callback();
    return 0 as unknown as ReturnType<typeof setTimeout>;
  }) as unknown as typeof setTimeout;

  globalThis.fetch = (async () => {
    attempts += 1;

    if (attempts < 3) {
      return new Response(
        JSON.stringify({ error: "Service unavailable" }),
        {
          status: 503,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        mediaId: "media-1",
        status: "completed",
        transcriptText: "hello",
        language: "en",
        model: "base",
        clipSeconds: 30,
        truncated: false,
        error: null,
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }) as typeof fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalSetTimeout;
    delete process.env.APP_URL;
    delete process.env.INTERNAL_TRANSCRIBER_API_KEY;
  });

  const response = await transcribeInstagramMedia({
    mediaId: "media-1",
    mediaUrl: "https://example.com/video.mp4",
    maxSeconds: 30,
  });

  assert.equal(attempts, 3);
  assert.equal(response.status, "completed");
});

test("transcribeInstagramMedia does not retry non-retryable responses", async (t) => {
  process.env.APP_URL = "https://instasights.example.com";
  process.env.INTERNAL_TRANSCRIBER_API_KEY = "test-key";

  let attempts = 0;
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () => {
    attempts += 1;

    return new Response(
      JSON.stringify({ error: "Invalid or missing API key." }),
      {
        status: 401,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }) as typeof fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
    delete process.env.APP_URL;
    delete process.env.INTERNAL_TRANSCRIBER_API_KEY;
  });

  await assert.rejects(
    () =>
      transcribeInstagramMedia({
        mediaId: "media-1",
        mediaUrl: "https://example.com/video.mp4",
        maxSeconds: 30,
      }),
    /Invalid or missing API key\./,
  );

  assert.equal(attempts, 1);
});
