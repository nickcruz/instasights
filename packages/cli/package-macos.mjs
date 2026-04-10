import { spawn } from "node:child_process";
import { chmod, copyFile, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const SENTINEL_FUSE = "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2";
const CLI_BINARY_NAME = "instagram-insights";
const UPDATER_BINARY_NAME = "instagram-insights-updater";
const VERSION_FILE_NAME = "instagram-insights.version.json";
const DEFAULT_MANIFEST_URL = "https://project-qah0p.vercel.app/api/cli/latest";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(packageDir, "../..");
const skillRoot = path.join(projectRoot, "skills/instagram-insights");
const skillBinDir = path.join(skillRoot, "bin");
const packageJson = JSON.parse(
  await readFile(path.join(packageDir, "package.json"), "utf8"),
);
const cliVersion = packageJson.version;
const updateManifestUrl =
  process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL?.trim() || DEFAULT_MANIFEST_URL;
const distRoot = path.join(packageDir, "dist", "macos-arm64");
const seaBuildDir = path.join(distRoot, "sea");
const artifactBinDir = path.join(distRoot, "bin");
const manualRoot = path.join(distRoot, "manual", "instagram-insights");
const postjectPath = path.join(projectRoot, "node_modules", ".bin", "postject");
const signingIdentity =
  process.env.INSTAGRAM_INSIGHTS_APPLE_SIGNING_IDENTITY?.trim() || "-";

function ensureSupportedHost() {
  if (process.platform !== "darwin") {
    throw new Error("macOS SEA packaging is only supported on macOS hosts.");
  }

  if (process.arch !== "arm64") {
    throw new Error("macOS SEA packaging currently targets Apple Silicon only.");
  }
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      ...options,
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code ?? 1}.`));
    });
  });
}

async function removeSignature(binaryPath) {
  try {
    await runCommand("codesign", ["--remove-signature", binaryPath]);
  } catch {
    // Fresh local binaries may not have a signature to remove.
  }
}

async function signBinary(binaryPath) {
  const args =
    signingIdentity === "-"
      ? ["--sign", "-", "--force", binaryPath]
      : [
          "--sign",
          signingIdentity,
          "--force",
          "--timestamp",
          "--options",
          "runtime",
          binaryPath,
        ];

  await runCommand("codesign", args);
}

async function buildSeaBundle({ entryPoint, outputFile }) {
  await build({
    bundle: true,
    entryPoints: [entryPoint],
    outfile: outputFile,
    format: "cjs",
    platform: "node",
    target: "node22",
    sourcemap: false,
    logLevel: "info",
    define: {
      __INSTAGRAM_INSIGHTS_CLI_VERSION__: JSON.stringify(cliVersion),
      __INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL__: JSON.stringify(updateManifestUrl),
    },
  });
}

async function buildSeaExecutable({ name, entryPoint }) {
  const seaEntryFile = path.join(seaBuildDir, `${name}.cjs`);
  const seaConfigFile = path.join(seaBuildDir, `${name}.sea-config.json`);
  const seaBlobFile = path.join(seaBuildDir, `${name}.blob`);
  const targetBinary = path.join(artifactBinDir, name);

  await buildSeaBundle({
    entryPoint,
    outputFile: seaEntryFile,
  });

  await writeFile(
    seaConfigFile,
    `${JSON.stringify(
      {
        main: seaEntryFile,
        output: seaBlobFile,
        disableExperimentalSEAWarning: true,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await runCommand(process.execPath, ["--experimental-sea-config", seaConfigFile], {
    cwd: packageDir,
  });

  await copyFile(process.execPath, targetBinary);
  await removeSignature(targetBinary);
  await runCommand(postjectPath, [
    targetBinary,
    "NODE_SEA_BLOB",
    seaBlobFile,
    "--sentinel-fuse",
    SENTINEL_FUSE,
    "--macho-segment-name",
    "NODE_SEA",
  ]);
  await signBinary(targetBinary);
  await chmod(targetBinary, 0o755).catch(() => undefined);

  return targetBinary;
}

async function copyArtifactsToSkill(targetPaths) {
  await mkdir(skillBinDir, { recursive: true });

  for (const targetPath of targetPaths) {
    const destination = path.join(skillBinDir, path.basename(targetPath));
    await copyFile(targetPath, destination);
    if (!destination.endsWith(".json")) {
      await chmod(destination, 0o755).catch(() => undefined);
    }
  }
}

async function prepareManualDistribution(targetPaths) {
  await mkdir(manualRoot, { recursive: true });
  await copyFile(path.join(skillRoot, "instagram-insights"), path.join(manualRoot, "instagram-insights"));
  await chmod(path.join(manualRoot, "instagram-insights"), 0o755).catch(() => undefined);
  await copyFile(path.join(skillRoot, "SKILL.md"), path.join(manualRoot, "SKILL.md"));
  await copyFile(path.join(skillRoot, ".skillignore"), path.join(manualRoot, ".skillignore"));
  await cp(path.join(skillRoot, "agents"), path.join(manualRoot, "agents"), { recursive: true });

  const manualBinDir = path.join(manualRoot, "bin");
  await mkdir(manualBinDir, { recursive: true });

  for (const targetPath of targetPaths) {
    const destination = path.join(manualBinDir, path.basename(targetPath));
    await copyFile(targetPath, destination);
    if (!destination.endsWith(".json")) {
      await chmod(destination, 0o755).catch(() => undefined);
    }
  }
}

ensureSupportedHost();

await rm(distRoot, { recursive: true, force: true });
await rm(skillBinDir, { recursive: true, force: true });
await mkdir(seaBuildDir, { recursive: true });
await mkdir(artifactBinDir, { recursive: true });

const artifactPaths = [
  await buildSeaExecutable({
    name: CLI_BINARY_NAME,
    entryPoint: path.join(packageDir, "src/index.ts"),
  }),
  await buildSeaExecutable({
    name: UPDATER_BINARY_NAME,
    entryPoint: path.join(packageDir, "src/updater-helper-main.ts"),
  }),
];

const versionFilePath = path.join(artifactBinDir, VERSION_FILE_NAME);
await writeFile(
  versionFilePath,
  `${JSON.stringify(
    {
      version: cliVersion,
      installedAt: null,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

artifactPaths.push(versionFilePath);

await copyArtifactsToSkill(artifactPaths);
await prepareManualDistribution(artifactPaths);

console.log(`Packaged macOS CLI binaries in ${artifactBinDir}`);
