#!/usr/bin/env node

import crypto from "node:crypto";
import { access } from "node:fs/promises";
import { chmod, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const MANAGED_FILES = [
  "bin/instagram-insights.mjs",
  "bin/instagram-insights-updater.mjs",
  "bin/instagram-insights.version.json",
];

function resolveSkillRoot() {
  const explicit = process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT?.trim();

  if (explicit) {
    return explicit;
  }

  return path.dirname(fileURLToPath(import.meta.url));
}

function getConfiguredManifestUrl() {
  const configured = process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL?.trim();
  return configured && configured.length > 0 ? configured : null;
}

function resolveManagedPath(skillRoot, relativePath) {
  const target = path.resolve(skillRoot, relativePath);
  const normalizedRoot = `${path.resolve(skillRoot)}${path.sep}`;

  if (target !== path.resolve(skillRoot) && !target.startsWith(normalizedRoot)) {
    throw new Error(`Refusing to access path outside the skill root: ${relativePath}`);
  }

  return target;
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function hasCompleteRuntime(skillRoot) {
  const checks = await Promise.all(
    MANAGED_FILES.map((relativePath) => fileExists(resolveManagedPath(skillRoot, relativePath))),
  );

  return checks.every(Boolean);
}

function resolveLocalBuildFiles(skillRoot) {
  const repoRoot = path.resolve(skillRoot, "../..");

  return [
    {
      source: path.join(repoRoot, "packages/cli/dist/index.mjs"),
      target: "bin/instagram-insights.mjs",
    },
    {
      source: path.join(repoRoot, "packages/cli/dist/instagram-insights-updater.mjs"),
      target: "bin/instagram-insights-updater.mjs",
    },
    {
      source: path.join(repoRoot, "packages/cli/dist/instagram-insights.version.json"),
      target: "bin/instagram-insights.version.json",
    },
  ];
}

async function localBuildIsAvailable(skillRoot) {
  const files = resolveLocalBuildFiles(skillRoot);
  const checks = await Promise.all(files.map((file) => fileExists(file.source)));
  return checks.every(Boolean);
}

function validateManifest(input) {
  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input;
  if (
    typeof candidate.version !== "string" ||
    typeof candidate.publishedAt !== "string" ||
    typeof candidate.notes !== "string" ||
    !Array.isArray(candidate.files)
  ) {
    return null;
  }

  const files = candidate.files.filter((file) => {
    return (
      file &&
      typeof file === "object" &&
      typeof file.path === "string" &&
      typeof file.url === "string" &&
      typeof file.sha256 === "string" &&
      /^[a-fA-F0-9]{64}$/.test(file.sha256)
    );
  });

  if (files.length !== candidate.files.length) {
    return null;
  }

  return {
    version: candidate.version,
    publishedAt: candidate.publishedAt,
    notes: candidate.notes,
    files,
  };
}

async function fetchManifest(manifestUrl) {
  const response = await fetch(manifestUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Manifest request failed with status ${response.status}.`);
  }

  const manifest = validateManifest(await response.json());

  if (!manifest) {
    throw new Error("Manifest is missing required fields.");
  }

  return manifest;
}

async function installFromRemoteManifest(skillRoot, manifestUrl) {
  const manifest = await fetchManifest(manifestUrl);
  const stagingDir = await mkdtemp(path.join(os.tmpdir(), "instagram-insights-bootstrap-"));

  try {
    for (const file of manifest.files) {
      if (!MANAGED_FILES.includes(file.path)) {
        continue;
      }

      const response = await fetch(file.url);
      if (!response.ok) {
        throw new Error(`Download failed for ${file.path}: ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const digest = crypto.createHash("sha256").update(buffer).digest("hex");

      if (digest !== file.sha256.toLowerCase()) {
        throw new Error(`Checksum mismatch for ${file.path}.`);
      }

      const stagedTarget = resolveManagedPath(stagingDir, file.path);
      await mkdir(path.dirname(stagedTarget), { recursive: true });
      await writeFile(stagedTarget, buffer);
    }

    for (const relativePath of MANAGED_FILES) {
      const source = resolveManagedPath(stagingDir, relativePath);
      const target = resolveManagedPath(skillRoot, relativePath);

      if (!(await fileExists(source))) {
        throw new Error(`Manifest did not include required runtime file: ${relativePath}`);
      }

      await mkdir(path.dirname(target), { recursive: true });
      await rename(source, target).catch(async () => {
        const buffer = await readFile(source);
        await writeFile(target, buffer);
      });

      if (target.endsWith(".mjs")) {
        await chmod(target, 0o755).catch(() => undefined);
      }
    }

    const versionPath = resolveManagedPath(skillRoot, "bin/instagram-insights.version.json");
    const versionMetadata = JSON.parse(await readFile(versionPath, "utf8"));
    await writeFile(
      versionPath,
      `${JSON.stringify(
        {
          ...versionMetadata,
          version: manifest.version,
          installedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
  } finally {
    await rm(stagingDir, { recursive: true, force: true });
  }
}

async function installFromLocalBuild(skillRoot) {
  for (const file of resolveLocalBuildFiles(skillRoot)) {
    const target = resolveManagedPath(skillRoot, file.target);
    const buffer = await readFile(file.source);

    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, buffer);

    if (target.endsWith(".mjs")) {
      await chmod(target, 0o755).catch(() => undefined);
    }
  }

  const versionPath = resolveManagedPath(skillRoot, "bin/instagram-insights.version.json");
  const versionMetadata = JSON.parse(await readFile(versionPath, "utf8"));
  await writeFile(
    versionPath,
    `${JSON.stringify(
      {
        ...versionMetadata,
        installedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

export async function ensureCliInstalled() {
  const skillRoot = resolveSkillRoot();

  if (await hasCompleteRuntime(skillRoot)) {
    return {
      installed: false,
      source: "existing",
    };
  }

  const manifestUrl = getConfiguredManifestUrl();

  if (manifestUrl) {
    await installFromRemoteManifest(skillRoot, manifestUrl);
    return {
      installed: true,
      source: "remote",
      manifestUrl,
    };
  }

  if (await localBuildIsAvailable(skillRoot)) {
    await installFromLocalBuild(skillRoot);
    return {
      installed: true,
      source: "local-build",
    };
  }

  throw new Error(
    "CLI runtime is not installed. Set INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL so the skill can download the latest CLI from S3, or run yarn build:cli in the repo to generate a local runtime.",
  );
}

if (process.argv.includes("--ensure-only")) {
  await ensureCliInstalled();
}
