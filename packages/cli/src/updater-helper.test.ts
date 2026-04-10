import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { applyStagedUpdate } from "./updater-helper";

test("applyStagedUpdate copies managed files and preserves auth state", async () => {
  const skillRoot = await mkdtemp(path.join(tmpdir(), "instagram-insights-skill-"));
  const stagingDir = await mkdtemp(path.join(tmpdir(), "instagram-insights-stage-"));

  try {
    await mkdir(path.join(skillRoot, ".auth"), { recursive: true });
    await mkdir(path.join(skillRoot, "bin"), { recursive: true });
    await mkdir(path.join(stagingDir, "bin"), { recursive: true });

    await writeFile(path.join(skillRoot, ".auth", "state.json"), '{"token":"keep"}\n', "utf8");
    await writeFile(path.join(stagingDir, "bin", "instagram-insights"), "new cli\n", "utf8");
    await writeFile(
      path.join(stagingDir, "bin", "instagram-insights-updater"),
      "new helper\n",
      "utf8",
    );
    await writeFile(
      path.join(stagingDir, "bin", "instagram-insights.version.json"),
      '{ "version": "1.0.2", "installedAt": null }\n',
      "utf8",
    );

    await applyStagedUpdate({
      skillRoot,
      stagingDir,
      version: "1.0.2",
      files: [
        { path: "bin/instagram-insights" },
        { path: "bin/instagram-insights-updater" },
        { path: "bin/instagram-insights.version.json" },
      ],
    });

    assert.equal(
      await readFile(path.join(skillRoot, "bin", "instagram-insights"), "utf8"),
      "new cli\n",
    );
    assert.equal(
      await readFile(path.join(skillRoot, "bin", "instagram-insights-updater"), "utf8"),
      "new helper\n",
    );
    assert.equal(
      await readFile(path.join(skillRoot, ".auth", "state.json"), "utf8"),
      '{"token":"keep"}\n',
    );

    const versionFile = JSON.parse(
      await readFile(path.join(skillRoot, "bin", "instagram-insights.version.json"), "utf8"),
    ) as { version: string; installedAt: string | null };

    assert.equal(versionFile.version, "1.0.2");
    assert.equal(typeof versionFile.installedAt, "string");
    assert.notEqual(versionFile.installedAt, null);
  } finally {
    await rm(skillRoot, { recursive: true, force: true });
    await rm(stagingDir, { recursive: true, force: true });
  }
});

test("applyStagedUpdate rejects unmanaged file paths", async () => {
  const skillRoot = await mkdtemp(path.join(tmpdir(), "instagram-insights-skill-"));
  const stagingDir = await mkdtemp(path.join(tmpdir(), "instagram-insights-stage-"));

  try {
    await assert.rejects(
      applyStagedUpdate({
        skillRoot,
        stagingDir,
        version: "1.0.2",
        files: [{ path: "bin/not-managed" }],
      }),
      /unmanaged file/i,
    );
  } finally {
    await rm(skillRoot, { recursive: true, force: true });
    await rm(stagingDir, { recursive: true, force: true });
  }
});
