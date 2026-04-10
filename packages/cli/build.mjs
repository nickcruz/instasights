import { build } from "esbuild";
import { chmod, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(packageDir, "../..");
const skillRoot = path.join(projectRoot, "skills/instagram-insights");
const skillBinDir = path.join(skillRoot, "bin");
const packageJson = JSON.parse(
  await readFile(path.join(packageDir, "package.json"), "utf8"),
);
const cliVersion = packageJson.version;
const updateManifestUrl =
  process.env.INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL?.trim() ||
  "https://project-qah0p.vercel.app/api/cli/latest";
const entryPoint = path.join(packageDir, "src/index.ts");
const updaterEntryPoint = path.join(packageDir, "src/updater-helper-main.ts");
const distDir = path.join(packageDir, "dist");
const distCliOutfile = path.join(distDir, "instagram-insights.mjs");
const distUpdaterOutfile = path.join(distDir, "instagram-insights-updater.mjs");
const distVersionFile = path.join(distDir, "instagram-insights.version.json");

const sharedOptions = {
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  sourcemap: false,
  logLevel: "info",
  banner: {
    js: [
      "#!/usr/bin/env node",
      'import { createRequire } from "node:module";',
      "const require = createRequire(import.meta.url);",
    ].join("\n"),
  },
  define: {
    __INSTAGRAM_INSIGHTS_CLI_VERSION__: JSON.stringify(cliVersion),
    __INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL__: JSON.stringify(updateManifestUrl),
  },
};

async function copyArtifactsToSkill(targetPaths) {
  await rm(skillBinDir, { recursive: true, force: true });
  await mkdir(skillBinDir, { recursive: true });

  for (const targetPath of targetPaths) {
    const destination = path.join(skillBinDir, path.basename(targetPath));
    await copyFile(targetPath, destination);

    if (destination.endsWith(".mjs")) {
      await chmod(destination, 0o755).catch(() => undefined);
    }
  }
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

await Promise.all([
  build({
    ...sharedOptions,
    entryPoints: [entryPoint],
    outfile: distCliOutfile,
  }),
  build({
    ...sharedOptions,
    entryPoints: [updaterEntryPoint],
    outfile: distUpdaterOutfile,
  }),
]);

const versionMetadata = `${JSON.stringify(
  {
    version: cliVersion,
    installedAt: null,
  },
  null,
  2,
)}\n`;

await Promise.all([
  writeFile(distVersionFile, versionMetadata, "utf8"),
]);

await Promise.all([
  chmod(distCliOutfile, 0o755).catch(() => undefined),
  chmod(distUpdaterOutfile, 0o755).catch(() => undefined),
]);

await copyArtifactsToSkill([
  distCliOutfile,
  distUpdaterOutfile,
  distVersionFile,
]);
