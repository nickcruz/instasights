import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  EMBEDDED_CLI_VERSION,
  EMBEDDED_UPDATE_MANIFEST_URL,
} from "./build-constants";
import { resolveSkillRoot } from "./auth-store";
import type {
  InstalledVersionMetadata,
  UpdateCheckCache,
} from "./types";

export const AUTO_UPDATE_TTL_MS = 12 * 60 * 60 * 1_000;
export const DISABLE_AUTO_UPDATE_ENV = "INSTAGRAM_INSIGHTS_DISABLE_AUTO_UPDATE";
export const SKIP_UPDATE_CHECK_ENV = "INSTAGRAM_INSIGHTS_SKIP_UPDATE_CHECK";
export const UPDATE_MANIFEST_URL_ENV = "INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL";

export const MANAGED_SKILL_FILES = [
  "bin/instagram-insights.mjs",
  "bin/instagram-insights-updater.mjs",
  "bin/instagram-insights.version.json",
] as const;

export function resolveInstalledVersionPath(skillRoot = resolveSkillRoot()) {
  return path.join(skillRoot, "bin", "instagram-insights.version.json");
}

export function resolveUpdateCachePath(skillRoot = resolveSkillRoot()) {
  return path.join(skillRoot, ".cache", "update-check.json");
}

export function resolveSkillEntrypointPath(skillRoot = resolveSkillRoot()) {
  return path.join(skillRoot, "bin", "instagram-insights.mjs");
}

export function resolveUpdaterEntrypointPath(skillRoot = resolveSkillRoot()) {
  return path.join(skillRoot, "bin", "instagram-insights-updater.mjs");
}

export function isManagedSkillInstall(skillRoot = resolveSkillRoot()) {
  return existsSync(path.join(skillRoot, "SKILL.md"));
}

function parseInstalledVersionMetadata(
  input: string,
): InstalledVersionMetadata | null {
  try {
    const parsed = JSON.parse(input) as Partial<InstalledVersionMetadata>;

    if (
      typeof parsed.version !== "string" ||
      parsed.version.trim().length === 0
    ) {
      return null;
    }

    return {
      version: parsed.version.trim(),
      installedAt:
        typeof parsed.installedAt === "string" ? parsed.installedAt : null,
    };
  } catch {
    return null;
  }
}

function parseUpdateCheckCache(input: string): UpdateCheckCache | null {
  try {
    const parsed = JSON.parse(input) as Partial<UpdateCheckCache>;

    if (
      typeof parsed.checkedAt !== "string" ||
      typeof parsed.remoteVersion !== "string" ||
      typeof parsed.updateAvailable !== "boolean" ||
      typeof parsed.manifestUrl !== "string"
    ) {
      return null;
    }

    return {
      checkedAt: parsed.checkedAt,
      localVersion:
        typeof parsed.localVersion === "string" ? parsed.localVersion : null,
      remoteVersion: parsed.remoteVersion,
      updateAvailable: parsed.updateAvailable,
      manifestUrl: parsed.manifestUrl,
    };
  } catch {
    return null;
  }
}

export function readInstalledVersionMetadataSync(
  skillRoot = resolveSkillRoot(),
) {
  try {
    const raw = readFileSync(resolveInstalledVersionPath(skillRoot), "utf8");
    return parseInstalledVersionMetadata(raw);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function readInstalledVersionMetadata(
  skillRoot = resolveSkillRoot(),
) {
  try {
    const raw = await readFile(resolveInstalledVersionPath(skillRoot), "utf8");
    return parseInstalledVersionMetadata(raw);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function writeInstalledVersionMetadata(
  metadata: InstalledVersionMetadata,
  skillRoot = resolveSkillRoot(),
) {
  const target = resolveInstalledVersionPath(skillRoot);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
}

export async function readUpdateCheckCache(skillRoot = resolveSkillRoot()) {
  try {
    const raw = await readFile(resolveUpdateCachePath(skillRoot), "utf8");
    return parseUpdateCheckCache(raw);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function writeUpdateCheckCache(
  cache: UpdateCheckCache,
  skillRoot = resolveSkillRoot(),
) {
  const target = resolveUpdateCachePath(skillRoot);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
}

export async function clearUpdateCheckCache(skillRoot = resolveSkillRoot()) {
  await rm(resolveUpdateCachePath(skillRoot), { force: true });
}

export function getConfiguredManifestUrl() {
  const override = process.env[UPDATE_MANIFEST_URL_ENV]?.trim();

  if (override) {
    return override;
  }

  const embedded = EMBEDDED_UPDATE_MANIFEST_URL.trim();
  return embedded.length > 0 ? embedded : null;
}

export function isAutoUpdateDisabled() {
  return process.env[DISABLE_AUTO_UPDATE_ENV] === "1";
}

export function shouldSkipUpdateCheck() {
  return process.env[SKIP_UPDATE_CHECK_ENV] === "1";
}

export function getCliVersion() {
  return readInstalledVersionMetadataSync()?.version ?? EMBEDDED_CLI_VERSION;
}
