import crypto from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFile = promisify(execFileCallback);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const skillRoot = path.join(projectRoot, "skills", "instasights");
const cliPackageJsonPath = path.join(projectRoot, "packages", "cli", "package.json");
const defaultOutputRoot = path.join(projectRoot, "packages", "cli", "dist", "skill");
const zipFilename = "instasights-skill.zip";
const manifestFilename = "latest.json";
const versionManifestFilename = "manifest.json";
const skillFolderName = "instasights";

function getArg(name, argv = process.argv.slice(2)) {
  const flag = `--${name}`;
  const index = argv.indexOf(flag);

  if (index === -1) {
    return null;
  }

  return argv[index + 1] ?? null;
}

function normalizePathForZip(value) {
  return value.split(path.sep).join("/");
}

export async function readSkillIgnorePatterns(root = skillRoot) {
  const ignorePath = path.join(root, ".skillignore");

  try {
    const raw = await readFile(ignorePath, "utf8");

    return raw
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

export function shouldExcludeSkillPath(relativePath, ignorePatterns) {
  const normalized = normalizePathForZip(relativePath).replace(/^\/+/u, "");

  if (normalized.length === 0) {
    return false;
  }

  const segments = normalized.split("/");

  if (segments.some((segment) => segment === ".DS_Store")) {
    return true;
  }

  return ignorePatterns.some((pattern) => {
    const normalizedPattern = normalizePathForZip(pattern).replace(/^\/+/u, "");

    if (normalizedPattern.length === 0) {
      return false;
    }

    if (normalizedPattern.endsWith("/")) {
      const directory = normalizedPattern.slice(0, -1);
      return normalized === directory || normalized.startsWith(`${directory}/`);
    }

    return normalized === normalizedPattern;
  });
}

async function getTrackedSkillFiles(root = projectRoot) {
  const { stdout } = await execFile(
    "git",
    ["ls-files", "-z", "--", normalizePathForZip(path.relative(root, skillRoot))],
    { cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  );

  return stdout
    .split("\0")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

async function stageTrackedSkillFiles(stagingRoot, trackedFiles, ignorePatterns) {
  const stagedSkillRoot = path.join(stagingRoot, skillFolderName);
  const trackedSkillRoot = path.join("skills", skillFolderName);

  await mkdir(stagedSkillRoot, { recursive: true });

  for (const trackedFile of trackedFiles) {
    const source = path.join(projectRoot, trackedFile);
    const relativeWithinSkill = normalizePathForZip(path.relative(trackedSkillRoot, trackedFile));

    if (
      relativeWithinSkill.startsWith("..") ||
      relativeWithinSkill.length === 0 ||
      shouldExcludeSkillPath(relativeWithinSkill, ignorePatterns)
    ) {
      continue;
    }

    const destination = path.join(stagedSkillRoot, relativeWithinSkill);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(source, destination);
  }

  return stagedSkillRoot;
}

async function createZipFromStage(stagingRoot, outputFile) {
  await mkdir(path.dirname(outputFile), { recursive: true });

  await execFile(
    "zip",
    ["-qr", outputFile, skillFolderName],
    {
      cwd: stagingRoot,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    },
  );
}

async function sha256File(filePath) {
  const buffer = await readFile(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function readCliVersion() {
  const packageJson = JSON.parse(await readFile(cliPackageJsonPath, "utf8"));
  const version = packageJson?.version;

  if (typeof version !== "string" || version.trim().length === 0) {
    throw new Error("Unable to read the CLI version from packages/cli/package.json.");
  }

  return version.trim();
}

export async function packageSkillBundle(options = {}) {
  const version = options.version ?? (await readCliVersion());
  const publishedAt = options.publishedAt ?? new Date().toISOString();
  const outputRoot = path.resolve(options.outputRoot ?? defaultOutputRoot);
  const baseUrl = (options.baseUrl ?? "skill").replace(/\/+$/u, "");
  const versionedZipRelativePath = `${version}/${zipFilename}`;
  const latestZipRelativePath = `latest/${zipFilename}`;
  const versionDir = path.join(outputRoot, version);
  const latestDir = path.join(outputRoot, "latest");
  const versionedZipPath = path.join(outputRoot, versionedZipRelativePath);
  const latestZipPath = path.join(outputRoot, latestZipRelativePath);
  const latestManifestPath = path.join(outputRoot, manifestFilename);
  const versionManifestPath = path.join(versionDir, versionManifestFilename);
  const ignorePatterns = await readSkillIgnorePatterns();
  const trackedFiles = await getTrackedSkillFiles();
  const stagingRoot = await mkdtemp(path.join(os.tmpdir(), "instasights-skill-bundle-"));

  try {
    await rm(outputRoot, { recursive: true, force: true });
    await mkdir(versionDir, { recursive: true });
    await mkdir(latestDir, { recursive: true });

    await stageTrackedSkillFiles(stagingRoot, trackedFiles, ignorePatterns);
    await createZipFromStage(stagingRoot, versionedZipPath);
    await copyFile(versionedZipPath, latestZipPath);

    const zipStat = await stat(versionedZipPath);
    const sha256 = await sha256File(versionedZipPath);
    const manifest = {
      version,
      publishedAt,
      zipUrl: `${baseUrl}/${versionedZipRelativePath}`,
      latestZipUrl: `${baseUrl}/${latestZipRelativePath}`,
      sha256,
      size: zipStat.size,
      skillPath: skillFolderName,
    };

    await writeFile(latestManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    await writeFile(versionManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

    return {
      manifest,
      latestManifestPath,
      latestZipPath,
      versionManifestPath,
      versionedZipPath,
    };
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }
}

async function main() {
  const result = await packageSkillBundle({
    baseUrl: getArg("base-url") ?? undefined,
    outputRoot: getArg("output-root") ?? undefined,
    publishedAt: getArg("published-at") ?? undefined,
    version: getArg("version") ?? undefined,
  });

  console.log(
    `Packaged Instasights skill bundle ${result.manifest.version} at ${result.versionedZipPath}`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main().catch((error) => {
    const message =
      error instanceof Error ? error.message : "Failed to package the Instasights skill bundle.";
    console.error(message);
    process.exit(1);
  });
}
