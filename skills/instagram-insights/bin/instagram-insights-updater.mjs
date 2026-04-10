#!/usr/bin/env node
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

// src/updater-helper.ts
import { fileURLToPath } from "node:url";
import { chmod, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// src/build-constants.ts
var EMBEDDED_CLI_VERSION = true ? "1.0.0" : process.env.INSTAGRAM_INSIGHTS_EMBEDDED_VERSION ?? "1.0.0";
var EMBEDDED_UPDATE_MANIFEST_URL = true ? "" : process.env.INSTAGRAM_INSIGHTS_EMBEDDED_UPDATE_MANIFEST_URL ?? "";

// src/version.ts
var AUTO_UPDATE_TTL_MS = 12 * 60 * 60 * 1e3;
var MANAGED_SKILL_FILES = [
  "instagram-insights.mjs",
  "bin/instagram-insights.mjs",
  "bin/instagram-insights-updater.mjs",
  "bin/instagram-insights.version.json"
];

// src/updater-helper.ts
function parseArg(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}
function getRequiredArg(flag) {
  const value = parseArg(flag);
  if (!value) {
    throw new Error(`Missing required argument: ${flag}`);
  }
  return value;
}
function resolveManagedPath(baseDir, relativePath) {
  const target = path.resolve(baseDir, relativePath);
  const normalizedBase = `${path.resolve(baseDir)}${path.sep}`;
  if (target !== path.resolve(baseDir) && !target.startsWith(normalizedBase)) {
    throw new Error(`Refusing to write outside the managed skill root: ${relativePath}`);
  }
  return target;
}
async function applyStagedUpdate(input) {
  const versionPath = resolveManagedPath(
    input.skillRoot,
    "bin/instagram-insights.version.json"
  );
  for (const file of input.files) {
    if (!MANAGED_SKILL_FILES.includes(file.path)) {
      throw new Error(`Refusing to install unmanaged file: ${file.path}`);
    }
    const source = resolveManagedPath(input.stagingDir, file.path);
    const target = resolveManagedPath(input.skillRoot, file.path);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
    if (target.endsWith(".mjs")) {
      await chmod(target, 493).catch(() => void 0);
    }
  }
  await writeFile(
    versionPath,
    `${JSON.stringify(
      {
        version: input.version,
        installedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      null,
      2
    )}
`,
    "utf8"
  );
  await chmod(versionPath, 420).catch(() => void 0);
}
async function main() {
  const payloadPath = getRequiredArg("--payload");
  const payload = JSON.parse(await readFile(payloadPath, "utf8"));
  await applyStagedUpdate(payload);
}
var executedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
var currentModulePath = path.resolve(fileURLToPath(import.meta.url));
if (executedPath === currentModulePath) {
  await main();
}
export {
  applyStagedUpdate
};
