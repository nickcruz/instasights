import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
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
const distOutfile = path.join(distDir, "index.mjs");
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

await mkdir(distDir, { recursive: true });

await Promise.all([
  build({
    ...sharedOptions,
    entryPoints: [entryPoint],
    outfile: distOutfile,
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
