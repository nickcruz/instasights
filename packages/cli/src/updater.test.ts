import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { checkForUpdates } from "./updater";
import { writeInstalledVersionMetadata } from "./version";

async function createManifestServer(version: string) {
  let manifestRequests = 0;
  const server = http.createServer((request, response) => {
    if (request.url === "/latest.json") {
      manifestRequests += 1;
      response.setHeader("Content-Type", "application/json");
      response.end(
        JSON.stringify({
          version,
          publishedAt: "2026-04-10T12:00:00Z",
          notes: "Test release",
          files: [
            {
              path: "bin/instagram-insights.mjs",
              url: "https://example.com/bin/instagram-insights.mjs",
              sha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            },
          ],
        }),
      );
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
