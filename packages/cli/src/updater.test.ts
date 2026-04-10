import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { applyUpdate, checkForUpdates } from "./updater";
import { writeInstalledVersionMetadata } from "./version";

test("committed .skillignore excludes local-only skill state", async () => {
  const skillIgnore = await readFile(
    new URL("../../../skills/instagram-insights/.skillignore", import.meta.url),
    "utf8",
  );

  assert.match(skillIgnore, /^\.auth\/$/m);
  assert.match(skillIgnore, /^\.cache\/$/m);
  assert.doesNotMatch(skillIgnore, /^bin\/$/m);
});
function createManifestPayload(version: string, files?: Array<{ path: string; url: string; sha256: string }>) {
  return {
    version,
    publishedAt: "2026-04-10T12:00:00Z",
    notes: "Test release",
    artifacts: {
      cli: {
        path: "bin/instagram-insights.mjs",
        url: "https://example.com/bin/instagram-insights.mjs",
        sha256:
          "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      },
      updater: {
        path: "bin/instagram-insights-updater.mjs",
        url: "https://example.com/bin/instagram-insights-updater.mjs",
        sha256:
          "1123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      },
      version: {
        path: "bin/instagram-insights.version.json",
        url: "https://example.com/bin/instagram-insights.version.json",
        sha256:
          "2123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      },
    },
    files:
      files ?? [
        {
          path: "bin/instagram-insights.mjs",
          url: "https://example.com/bin/instagram-insights.mjs",
          sha256:
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        },
        {
          path: "bin/instagram-insights-updater.mjs",
          url: "https://example.com/bin/instagram-insights-updater.mjs",
          sha256:
            "1123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        },
        {
          path: "bin/instagram-insights.version.json",
          url: "https://example.com/bin/instagram-insights.version.json",
          sha256:
            "2123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        },
      ],
  };
}

async function createManifestServer(
  version: string,
  options?: {
    files?: Array<{ path: string; url: string; sha256: string }>;
  },
) {
  let manifestRequests = 0;
  const server = http.createServer((request, response) => {
    if (request.url === "/latest.json") {
      manifestRequests += 1;
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(createManifestPayload(version, options?.files)));
      return;
    }

    response.statusCode = 404;
    response.end();
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected an HTTP server address.");
  }

  return {
    manifestUrl: `http://127.0.0.1:${address.port}/latest.json`,
    getManifestRequests: () => manifestRequests,
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
  };
}

test("legacy installs are treated as older and request the latest release", async () => {
  const originalSkillRoot = process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT;
  const originalManifestUrl = process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL;
  const tempRoot = await mkdtemp(path.join(tmpdir(), "instagram-insights-update-"));
  const server = await createManifestServer("1.0.1");

  process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT = tempRoot;
  process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL = server.manifestUrl;

  try {
    const result = await checkForUpdates({
      allowCache: false,
      force: false,
    });

    assert.equal(result.legacyInstall, true);
    assert.equal(result.updateAvailable, true);
    assert.equal(result.remoteVersion, "1.0.1");
    assert.equal(result.status, "update-available");
  } finally {
    await server.close();
    if (originalSkillRoot === undefined) {
      delete process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT;
    } else {
      process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT = originalSkillRoot;
    }

    if (originalManifestUrl === undefined) {
      delete process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL;
    } else {
      process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL = originalManifestUrl;
    }

    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("equal versions are current unless the caller explicitly forces a reinstall", async () => {
  const originalSkillRoot = process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT;
  const originalManifestUrl = process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL;
  const tempRoot = await mkdtemp(path.join(tmpdir(), "instagram-insights-update-"));
  const server = await createManifestServer("1.0.1");

  process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT = tempRoot;
  process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL = server.manifestUrl;

  try {
    await writeInstalledVersionMetadata({
      version: "1.0.1",
      installedAt: "2026-04-10T12:00:00Z",
    });

    const current = await checkForUpdates({
      allowCache: false,
      force: false,
    });
    const forced = await checkForUpdates({
      allowCache: false,
      force: true,
    });

    assert.equal(current.status, "current");
    assert.equal(current.updateAvailable, false);
    assert.equal(forced.updateAvailable, true);
    assert.equal(forced.remoteVersion, "1.0.1");
  } finally {
    await server.close();
    if (originalSkillRoot === undefined) {
      delete process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT;
    } else {
      process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT = originalSkillRoot;
    }

    if (originalManifestUrl === undefined) {
      delete process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL;
    } else {
      process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL = originalManifestUrl;
    }

    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("fresh cache entries skip a second manifest fetch", async () => {
  const originalSkillRoot = process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT;
  const originalManifestUrl = process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL;
  const tempRoot = await mkdtemp(path.join(tmpdir(), "instagram-insights-update-"));
  const server = await createManifestServer("1.0.2");

  process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT = tempRoot;
  process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL = server.manifestUrl;

  try {
    await writeFile(path.join(tempRoot, "SKILL.md"), "test skill\n", "utf8");
    await writeInstalledVersionMetadata({
      version: "1.0.1",
      installedAt: "2026-04-10T12:00:00Z",
    });

    const first = await checkForUpdates({
      allowCache: true,
      force: false,
    });
    const second = await checkForUpdates({
      allowCache: true,
      force: false,
    });

    assert.equal(first.fromCache, false);
    assert.equal(second.fromCache, true);
    assert.equal(server.getManifestRequests(), 1);
    assert.equal(second.updateAvailable, true);
  } finally {
    await server.close();
    if (originalSkillRoot === undefined) {
      delete process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT;
    } else {
      process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT = originalSkillRoot;
    }

    if (originalManifestUrl === undefined) {
      delete process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL;
    } else {
      process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL = originalManifestUrl;
    }

    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("legacy binary manifests are skipped for the bundled Node runtime", async () => {
  const originalSkillRoot = process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT;
  const originalManifestUrl = process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL;
  const tempRoot = await mkdtemp(path.join(tmpdir(), "instagram-insights-update-"));
  const server = await createManifestServer("1.0.4", {
    files: [
      {
        path: "bin/instagram-insights",
        url: "https://example.com/bin/instagram-insights",
        sha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      },
      {
        path: "bin/instagram-insights-updater",
        url: "https://example.com/bin/instagram-insights-updater",
        sha256: "1123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      },
      {
        path: "bin/instagram-insights.version.json",
        url: "https://example.com/bin/instagram-insights.version.json",
        sha256: "2123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      },
    ],
  });

  process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT = tempRoot;
  process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL = server.manifestUrl;

  try {
    await writeInstalledVersionMetadata({
      version: "1.0.0",
      installedAt: "2026-04-10T12:00:00Z",
    });

    const result = await checkForUpdates({
      allowCache: false,
      force: false,
    });
    const applyResult = await applyUpdate(result, {
      force: true,
    });

    assert.equal(result.status, "invalid-manifest");
    assert.equal(result.updateAvailable, false);
    assert.equal(result.remoteVersion, "1.0.4");
    assert.match(result.error ?? "", /legacy artifact layout/i);
    assert.equal(applyResult.applied, false);
    assert.match(applyResult.reason ?? "", /legacy artifact layout/i);
  } finally {
    await server.close();
    if (originalSkillRoot === undefined) {
      delete process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT;
    } else {
      process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT = originalSkillRoot;
    }

    if (originalManifestUrl === undefined) {
      delete process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL;
    } else {
      process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL = originalManifestUrl;
    }

    await rm(tempRoot, { recursive: true, force: true });
  }
});
