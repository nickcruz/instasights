import crypto from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, posix } from "node:path";

const MANAGED_SKILL_FILES = [
  {
    key: "cli",
    artifactPath: "instagram-insights.mjs",
    remotePath: "bin/instagram-insights.mjs",
  },
  {
    key: "updater",
    artifactPath: "instagram-insights-updater.mjs",
    remotePath: "bin/instagram-insights-updater.mjs",
  },
  {
    key: "version",
    artifactPath: "instagram-insights.version.json",
    remotePath: "bin/instagram-insights.version.json",
  },
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
const artifactRoot = resolve(getArg("artifact-root") ?? "packages/cli/dist");

const files = await Promise.all(
  MANAGED_SKILL_FILES.map(async ({ artifactPath, remotePath }) => {
    const absolutePath = resolve(artifactRoot, artifactPath);
    const buffer = await readFile(absolutePath);
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

    return {
      path: remotePath,
      url: `${baseUrl}/${posix.join(version, remotePath)}`,
      sha256,
    };
  }),
);

const artifacts = Object.fromEntries(
  files.map((file, index) => [
    MANAGED_SKILL_FILES[index].key,
    {
      path: file.path,
      url: file.url,
      sha256: file.sha256,
    },
  ]),
);

await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      version,
      publishedAt,
      notes,
      artifacts,
      files,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Wrote CLI update manifest to ${outputPath}`);
