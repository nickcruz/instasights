import assert from "node:assert/strict";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  clearAuthTokens,
  readAuthState,
  resolveAuthDir,
  resolveAuthStatePath,
  writeAuthState,
} from "./auth-store";

test("clearAuthTokens removes the local auth directory and resets state", async () => {
  const originalSkillRoot = process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT;
  const tempRoot = await mkdtemp(path.join(tmpdir(), "instagram-insights-auth-"));

  process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT = tempRoot;

  try {
    await writeAuthState({
      appUrl: "https://example.com",
      clientId: "client_123",
      redirectUri: "http://127.0.0.1:8787/callback",
      accessToken: "access_123",
      refreshToken: "refresh_123",
      expiresAt: new Date().toISOString(),
    });

    await clearAuthTokens();

    await assert.rejects(access(resolveAuthStatePath()));
    await assert.rejects(access(resolveAuthDir()));

    const state = await readAuthState();

    assert.deepEqual(state, {
      appUrl: "https://project-qah0p.vercel.app",
      clientId: null,
      redirectUri: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    });
  } finally {
    if (originalSkillRoot === undefined) {
      delete process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT;
    } else {
      process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT = originalSkillRoot;
    }

    await rm(tempRoot, { recursive: true, force: true });
  }
});
