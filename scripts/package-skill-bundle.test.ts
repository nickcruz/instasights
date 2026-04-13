import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

import {
  packageSkillBundle,
  readSkillIgnorePatterns,
  shouldExcludeSkillPath,
} from "./package-skill-bundle.mjs";

const execFile = promisify(execFileCallback);

test("shouldExcludeSkillPath filters runtime state and ignores Finder trash", async () => {
  const ignorePatterns = await readSkillIgnorePatterns();

  assert.equal(shouldExcludeSkillPath(".auth/state.json", ignorePatterns), true);
  assert.equal(shouldExcludeSkillPath(".cache/update-check.json", ignorePatterns), true);
  assert.equal(shouldExcludeSkillPath("nested/.DS_Store", ignorePatterns), true);
  assert.equal(shouldExcludeSkillPath("bin/instasights.mjs", ignorePatterns), false);
});

test("packageSkillBundle creates a zip with the committed skill contents only", async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "instasights-packaged-skill-"));

  try {
    const result = await packageSkillBundle({
      baseUrl: "https://example.com/skill",
      outputRoot,
      publishedAt: "2026-04-13T12:00:00.000Z",
      version: "9.9.9",
    });

    const manifest = JSON.parse(await readFile(result.latestManifestPath, "utf8")) as {
      version: string;
      zipUrl: string;
      latestZipUrl: string;
      skillPath: string;
      sha256: string;
      size: number;
    };
    const { stdout } = await execFile(
      "unzip",
      ["-Z1", result.versionedZipPath],
      { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
    );
    const zipEntries = stdout
      .split(/\r?\n/u)
      .map((entry) => entry.trim())
      .filter(Boolean);

    assert.equal(manifest.version, "9.9.9");
    assert.equal(manifest.zipUrl, "https://example.com/skill/9.9.9/instasights-skill.zip");
    assert.equal(
      manifest.latestZipUrl,
      "https://example.com/skill/latest/instasights-skill.zip",
    );
    assert.equal(manifest.skillPath, "instasights");
    assert.match(manifest.sha256, /^[a-f0-9]{64}$/u);
    assert.ok(manifest.size > 0);

    assert.ok(zipEntries.includes("instasights/SKILL.md"));
    assert.ok(zipEntries.includes("instasights/CLI.md"));
    assert.ok(zipEntries.includes("instasights/agents/openai.yaml"));
    assert.ok(zipEntries.includes("instasights/instasights"));
    assert.ok(zipEntries.includes("instasights/bin/instasights.mjs"));
    assert.ok(zipEntries.includes("instasights/bin/instasights-updater.mjs"));
    assert.ok(zipEntries.includes("instasights/bin/instasights.version.json"));
    assert.equal(zipEntries.some((entry) => entry.includes(".auth/")), false);
    assert.equal(zipEntries.some((entry) => entry.includes(".cache/")), false);
    assert.equal(zipEntries.some((entry) => entry.endsWith(".DS_Store")), false);
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});
