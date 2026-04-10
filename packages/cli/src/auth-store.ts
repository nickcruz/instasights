import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DEFAULT_APP_URL } from "./constants";
import type { StoredAuthState } from "./types";

function resolveBundleDir() {
  return path.dirname(fileURLToPath(import.meta.url));
}

export function resolveSkillRoot() {
  const explicit = process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT;

  if (explicit) {
    return explicit;
  }

  return path.resolve(resolveBundleDir(), "..");
}

export function resolveAuthDir() {
  return path.join(resolveSkillRoot(), ".auth");
}

export function resolveAuthStatePath() {
  return path.join(resolveAuthDir(), "state.json");
}

export function createEmptyState(appUrl = DEFAULT_APP_URL): StoredAuthState {
  return {
    appUrl,
    clientId: null,
    redirectUri: null,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  };
}

export async function readAuthState() {
  try {
    const raw = await readFile(resolveAuthStatePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<StoredAuthState>;

    return {
      ...createEmptyState(parsed.appUrl ?? DEFAULT_APP_URL),
      ...parsed,
    } satisfies StoredAuthState;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return createEmptyState();
    }

    throw error;
  }
}

export async function writeAuthState(state: StoredAuthState) {
  const authDir = resolveAuthDir();
  const target = resolveAuthStatePath();

  await mkdir(authDir, { recursive: true, mode: 0o700 });
  await chmod(authDir, 0o700).catch(() => undefined);
  await writeFile(target, JSON.stringify(state, null, 2), "utf8");
  await chmod(target, 0o600).catch(() => undefined);
}

export async function clearAuthTokens() {
  await rm(resolveAuthDir(), { recursive: true, force: true });
}

export async function deleteAuthState() {
  await rm(resolveAuthStatePath(), { force: true });
}
