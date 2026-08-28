import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import type { TranscriptionResponse } from "@instasights/contracts";

import { transcribeAudioWithSoniox } from "@/lib/server/transcription-provider";

const execFile = promisify(execFileCallback);
const MAX_DOWNLOAD_BYTES = 200 * 1024 * 1024;

function resolveFfmpegPath() {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static binary path is unavailable.");
  }

  return ffmpegPath;
}

function resolveFfprobePath() {
  if (!ffprobeStatic.path) {
    throw new Error("ffprobe-static binary path is unavailable.");
  }

  return ffprobeStatic.path;
}

async function downloadMediaFile(input: { mediaUrl: string; outputPath: string }) {
  const response = await fetch(input.mediaUrl, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to download media: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength > MAX_DOWNLOAD_BYTES) {
    throw new Error("Media file exceeded maximum allowed size.");
  }

  await writeFile(input.outputPath, buffer);
}

async function probeDurationSeconds(filePath: string) {
  const { stdout } = await execFile(resolveFfprobePath(), [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);

  const duration = Number.parseFloat(stdout.trim());

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Unable to resolve media duration.");
  }

  return duration;
}

async function extractWavClip(input: {
  sourcePath: string;
  destinationPath: string;
  clipSeconds: number;
}) {
  await execFile(resolveFfmpegPath(), [
    "-y",
    "-i",
    input.sourcePath,
    "-t",
    String(input.clipSeconds),
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-f",
    "wav",
    input.destinationPath,
  ]);
}

export async function runTranscriptionJob(input: {
  mediaId: string;
  mediaUrl: string;
  maxSeconds: number;
}): Promise<TranscriptionResponse> {
  const workDir = await mkdtemp(join(tmpdir(), "instasights-transcribe-"));
  const mediaPath = join(workDir, `source-${input.mediaId}.mp4`);
  const clipPath = join(workDir, `clip-${input.mediaId}.wav`);

  try {
    await downloadMediaFile({ mediaUrl: input.mediaUrl, outputPath: mediaPath });

    const sourceDuration = await probeDurationSeconds(mediaPath);
    const clipSeconds = Math.max(1, Math.floor(Math.min(sourceDuration, input.maxSeconds)));
    const truncated = sourceDuration > clipSeconds;

    await extractWavClip({
      sourcePath: mediaPath,
      destinationPath: clipPath,
      clipSeconds,
    });

    const clipStats = await stat(clipPath);
    if (!clipStats.size) {
      throw new Error("Generated clip was empty.");
    }

    const wavBuffer = await readFile(clipPath);
    const providerResult = await transcribeAudioWithSoniox({
      wavBuffer,
      fileName: basename(clipPath),
      languageHints: ["en"],
    });

    return {
      mediaId: input.mediaId,
      status: providerResult.transcriptText ? "completed" : "failed",
      transcriptText: providerResult.transcriptText || undefined,
      language: providerResult.language,
      model: providerResult.model,
      clipSeconds,
      truncated,
      error: providerResult.transcriptText ? undefined : "No transcript text returned.",
    };
  } catch (error) {
    return {
      mediaId: input.mediaId,
      status: "failed",
      model: "soniox",
      clipSeconds: 0,
      truncated: false,
      error: error instanceof Error ? error.message : "Transcription failed.",
    };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
