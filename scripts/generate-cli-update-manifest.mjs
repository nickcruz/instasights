import crypto from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, posix } from "node:path";

const MANAGED_SKILL_FILES = [
  "instagram-insights.mjs",
  "bin/instagram-insights.mjs",
  "bin/instagram-insights-updater.mjs",
  "bin/instagram-insights.version.json",
];

function getArg(name) {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

function getRequiredArg(name) {
  const value = getArg(name);
  if (!value) {
    throw new Error(`Missing required argument: --${name}`);
  }

  return value;
}

const version = getRequiredArg("version");
const baseUrl = getRequiredArg("base-url").replace(/\/+$/, "");
const outputPath = resolve(getRequiredArg("output"));
const notes = getArg("notes") ?? "";
const publishedAt = getArg("published-at") ?? new Date().toISOString();
const skillRoot = resolve(getArg("skill-root") ?? "skills/instagram-insights");

const files = await Promise.all(
  MANAGED_SKILL_FILES.map(async (relativePath) => {
    const absolutePath = resolve(skillRoot, relativePath);
    const buffer = await readFile(absolutePath);
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

    return {
      path: relativePath,
      url: `${baseUrl}/${posix.join(version, relativePath)}`,
      sha256,
    };
  }),
);

await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      version,
      publishedAt,
      notes,
      files,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Wrote CLI update manifest to ${outputPath}`);
