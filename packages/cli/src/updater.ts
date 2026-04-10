import crypto from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

import type {
  RemoteUpdateFile,
  RemoteUpdateManifest,
  UpdateApplyResult,
  UpdateCheckResult,
  UpdateCheckStatus,
} from "./types";
import { EMBEDDED_CLI_VERSION } from "./build-constants";
import { resolveSkillRoot } from "./auth-store";
import {
  AUTO_UPDATE_TTL_MS,
  clearUpdateCheckCache,
  getConfiguredManifestUrl,
  isAutoUpdateDisabled,
  isManagedSkillInstall,
  readInstalledVersionMetadata,
  readUpdateCheckCache,
  resolveSkillEntrypointPath,
  resolveUpdaterEntrypointPath,
  shouldSkipUpdateCheck,
  SKIP_UPDATE_CHECK_ENV,
  writeUpdateCheckCache,
  getCliVersion,
} from "./version";

type CheckForUpdatesOptions = {
  allowCache: boolean;
  force: boolean;
};

function parseSemver(version: string) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());

  if (!match) {
    return null;
  }

  return match.slice(1).map((part) => Number.parseInt(part, 10)) as [
    number,
    number,
    number,
  ];
}

export function compareVersions(left: string, right: string) {
  const leftParts = parseSemver(left);
  const rightParts = parseSemver(right);

  if (!leftParts || !rightParts) {
    return null;
  }

  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] > rightParts[index]) {
      return 1;
    }

    if (leftParts[index] < rightParts[index]) {
      return -1;
    }
  }

  return 0;
}

function getDefaultCheckResult(
  status: UpdateCheckStatus,
  input: Partial<UpdateCheckResult>,
): UpdateCheckResult {
  const currentVersion = getCliVersion();

  return {
    checkedAt: new Date().toISOString(),
    status,
    manifestUrl: input.manifestUrl ?? null,
    embeddedVersion: EMBEDDED_CLI_VERSION,
    currentVersion,
    localVersion: input.localVersion ?? null,
    remoteVersion: input.remoteVersion ?? null,
    legacyInstall: input.legacyInstall ?? false,
    updateAvailable: input.updateAvailable ?? false,
    notes: input.notes ?? "",
    fromCache: input.fromCache ?? false,
    manifest: input.manifest ?? null,
    error: input.error ?? null,
  };
}

function validateRemoteFile(input: unknown): RemoteUpdateFile | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input as Partial<RemoteUpdateFile>;
  if (
    typeof candidate.path !== "string" ||
    candidate.path.trim().length === 0 ||
    typeof candidate.url !== "string" ||
    candidate.url.trim().length === 0 ||
    typeof candidate.sha256 !== "string" ||
    !/^[a-fA-F0-9]{64}$/.test(candidate.sha256.trim())
  ) {
    return null;
  }

  return {
    path: candidate.path.trim(),
    url: candidate.url.trim(),
    sha256: candidate.sha256.trim().toLowerCase(),
  };
}

function validateRemoteManifest(input: unknown): RemoteUpdateManifest | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input as Partial<RemoteUpdateManifest>;
  if (
    typeof candidate.version !== "string" ||
    parseSemver(candidate.version) === null ||
    typeof candidate.publishedAt !== "string" ||
    typeof candidate.notes !== "string" ||
    !Array.isArray(candidate.files)
  ) {
    return null;
  }

  const files = candidate.files
    .map((file) => validateRemoteFile(file))
    .filter((file): file is RemoteUpdateFile => file !== null);

  if (files.length !== candidate.files.length || files.length === 0) {
    return null;
  }

  return {
    version: candidate.version,
    publishedAt: candidate.publishedAt,
    notes: candidate.notes,
    files,
  };
}

async function fetchRemoteManifest(manifestUrl: string) {
  const response = await fetch(manifestUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Manifest request failed with status ${response.status}.`);
  }

  return validateRemoteManifest(await response.json());
}

function isCacheFresh(checkedAt: string) {
  const parsed = Date.parse(checkedAt);

  if (Number.isNaN(parsed)) {
    return false;
  }

  return Date.now() - parsed < AUTO_UPDATE_TTL_MS;
}

function isSameOrNewerVersion(remoteVersion: string, localVersion: string | null) {
  if (!localVersion) {
    return true;
  }

  const comparison = compareVersions(remoteVersion, localVersion);
  return comparison !== null && comparison >= 0;
}

export function canAutoUpdate(args: string[]) {
  if (args[0] === "update") {
    return false;
  }

  if (isAutoUpdateDisabled() || shouldSkipUpdateCheck()) {
    return false;
  }

  if (!isManagedSkillInstall()) {
    return false;
  }

  return Boolean(getConfiguredManifestUrl());
}

export async function checkForUpdates(
  options: CheckForUpdatesOptions,
): Promise<UpdateCheckResult> {
  const manifestUrl = getConfiguredManifestUrl();
  const localMetadata = await readInstalledVersionMetadata();
  const localVersion = localMetadata?.version ?? null;
  const legacyInstall = localMetadata === null;

  if (!manifestUrl) {
    return getDefaultCheckResult("disabled", {
      manifestUrl: null,
      localVersion,
      legacyInstall,
      notes: "Update manifest URL is not configured for this build.",
    });
  }

  if (options.allowCache && !options.force) {
    const cache = await readUpdateCheckCache();

    if (
      cache &&
      cache.manifestUrl === manifestUrl &&
      cache.localVersion === localVersion &&
      isCacheFresh(cache.checkedAt)
    ) {
      return getDefaultCheckResult(cache.updateAvailable ? "cache" : "cache", {
        manifestUrl,
        localVersion,
        legacyInstall,
        remoteVersion: cache.remoteVersion,
        updateAvailable: cache.updateAvailable,
        fromCache: true,
        notes: cache.updateAvailable
          ? `Update ${cache.remoteVersion} is still available.`
          : "Current version is up to date.",
      });
    }
  }

  try {
    const manifest = await fetchRemoteManifest(manifestUrl);

    if (!manifest) {
      return getDefaultCheckResult("invalid-manifest", {
        manifestUrl,
        localVersion,
        legacyInstall,
        error: "Remote manifest is missing required fields.",
      });
    }

    const comparison =
      localVersion === null ? 1 : compareVersions(manifest.version, localVersion);
    const updateAvailable =
      options.force || localVersion === null
        ? isSameOrNewerVersion(manifest.version, localVersion)
        : comparison !== null && comparison > 0;
    const status = updateAvailable ? "update-available" : "current";

    await writeUpdateCheckCache({
      checkedAt: new Date().toISOString(),
      localVersion,
      remoteVersion: manifest.version,
      updateAvailable,
      manifestUrl,
    });

    return getDefaultCheckResult(status, {
      manifestUrl,
      localVersion,
      remoteVersion: manifest.version,
      legacyInstall,
      updateAvailable,
      notes: manifest.notes,
      manifest,
    });
  } catch (error) {
    return getDefaultCheckResult("network-error", {
      manifestUrl,
      localVersion,
      legacyInstall,
      error: error instanceof Error ? error.message : "Unable to fetch updates.",
    });
  }
}

function resolveManagedPath(baseDir: string, relativePath: string) {
  const target = path.resolve(baseDir, relativePath);
  const normalizedBase = `${path.resolve(baseDir)}${path.sep}`;

  if (target !== path.resolve(baseDir) && !target.startsWith(normalizedBase)) {
    throw new Error(`Refusing to access path outside the managed skill root: ${relativePath}`);
  }

  return target;
}

async function downloadManagedFile(stagingDir: string, file: RemoteUpdateFile) {
  const response = await fetch(file.url);

  if (!response.ok) {
    throw new Error(`Download failed for ${file.path}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const digest = crypto.createHash("sha256").update(buffer).digest("hex");

  if (digest !== file.sha256) {
    throw new Error(`Checksum mismatch for ${file.path}.`);
  }

  const target = resolveManagedPath(stagingDir, file.path);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, buffer);
}

async function runUpdaterHelper(payloadPath: string) {
  const bundledHelperPath = resolveUpdaterEntrypointPath();
  const helperCopyPath = path.join(
    path.dirname(payloadPath),
    "instagram-insights-updater.run.mjs",
  );
  const helperSource = await readFile(bundledHelperPath, "utf8");
  await writeFile(helperCopyPath, helperSource, "utf8");

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [helperCopyPath, "--payload", payloadPath], {
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Updater helper exited with code ${code ?? 1}.`));
    });
  });
}

export async function applyUpdate(
  checkResult: UpdateCheckResult,
  options?: { force?: boolean },
): Promise<UpdateApplyResult> {
  if (!checkResult.manifestUrl || !checkResult.manifest) {
    return {
      applied: false,
      previousVersion: checkResult.localVersion,
      currentVersion: checkResult.currentVersion,
      manifestUrl: checkResult.manifestUrl,
      remoteVersion: checkResult.remoteVersion,
      legacyInstall: checkResult.legacyInstall,
      notes: checkResult.notes,
      reason: checkResult.error ?? "No remote manifest is available.",
    };
  }

  const canApplyVersion =
    checkResult.remoteVersion !== null &&
    isSameOrNewerVersion(checkResult.remoteVersion, checkResult.localVersion);
  const shouldApply =
    canApplyVersion && (options?.force === true || checkResult.updateAvailable);

  if (!shouldApply) {
    return {
      applied: false,
      previousVersion: checkResult.localVersion,
      currentVersion: checkResult.currentVersion,
      manifestUrl: checkResult.manifestUrl,
      remoteVersion: checkResult.remoteVersion,
      legacyInstall: checkResult.legacyInstall,
      notes: checkResult.notes,
      reason: "Already running the latest available version.",
    };
  }

  const stagingDir = await mkdtemp(path.join(os.tmpdir(), "instagram-insights-update-"));
  const payloadPath = path.join(stagingDir, "update-payload.json");

  try {
    await Promise.all(
      checkResult.manifest.files.map((file) => downloadManagedFile(stagingDir, file)),
    );

    await writeFile(
      payloadPath,
      `${JSON.stringify(
        {
          skillRoot: resolveSkillRoot(),
          stagingDir,
          version: checkResult.manifest.version,
          files: checkResult.manifest.files.map((file) => ({ path: file.path })),
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    await runUpdaterHelper(payloadPath);

    await clearUpdateCheckCache();
    await writeUpdateCheckCache({
      checkedAt: new Date().toISOString(),
      localVersion: checkResult.manifest.version,
      remoteVersion: checkResult.manifest.version,
      updateAvailable: false,
      manifestUrl: checkResult.manifestUrl,
    });

    return {
      applied: true,
      previousVersion: checkResult.localVersion,
      currentVersion: checkResult.manifest.version,
      manifestUrl: checkResult.manifestUrl,
      remoteVersion: checkResult.manifest.version,
      legacyInstall: checkResult.legacyInstall,
      notes: checkResult.manifest.notes,
    };
  } finally {
    await rm(stagingDir, { recursive: true, force: true });
  }
}

export async function relaunchCli(args: string[]) {
  const entrypoint = resolveSkillEntrypointPath();
  const exitCode = await new Promise<number>((resolve, reject) => {
    const child = spawn(process.execPath, [entrypoint, ...args], {
      stdio: "inherit",
      env: {
        ...process.env,
        [SKIP_UPDATE_CHECK_ENV]: "1",
      },
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) {
        resolve(1);
        return;
      }

      resolve(code ?? 0);
    });
  });
  process.exit(exitCode);
}
