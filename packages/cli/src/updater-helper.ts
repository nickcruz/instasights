import { fileURLToPath } from "node:url";
import { chmod, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { MANAGED_SKILL_FILES } from "./version";

type HelperFile = {
  path: string;
};

export type ApplyStagedUpdateInput = {
  skillRoot: string;
  stagingDir: string;
  version: string;
  files: HelperFile[];
};

function parseArg(flag: string) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

function getRequiredArg(flag: string) {
  const value = parseArg(flag);

  if (!value) {
    throw new Error(`Missing required argument: ${flag}`);
  }

  return value;
}

function resolveManagedPath(baseDir: string, relativePath: string) {
  const target = path.resolve(baseDir, relativePath);
  const normalizedBase = `${path.resolve(baseDir)}${path.sep}`;

  if (target !== path.resolve(baseDir) && !target.startsWith(normalizedBase)) {
    throw new Error(`Refusing to write outside the managed skill root: ${relativePath}`);
  }

  return target;
}

export async function applyStagedUpdate(input: ApplyStagedUpdateInput) {
  const versionPath = resolveManagedPath(
    input.skillRoot,
    "bin/instagram-insights.version.json",
  );

  for (const file of input.files) {
    if (!MANAGED_SKILL_FILES.includes(file.path as (typeof MANAGED_SKILL_FILES)[number])) {
      throw new Error(`Refusing to install unmanaged file: ${file.path}`);
    }

    const source = resolveManagedPath(input.stagingDir, file.path);
    const target = resolveManagedPath(input.skillRoot, file.path);

    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);

    if (target.endsWith(".mjs")) {
      await chmod(target, 0o755).catch(() => undefined);
    }
  }

  await writeFile(
    versionPath,
    `${JSON.stringify(
      {
        version: input.version,
        installedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await chmod(versionPath, 0o644).catch(() => undefined);
}

async function main() {
  const payloadPath = getRequiredArg("--payload");
  const payload = JSON.parse(await readFile(payloadPath, "utf8")) as ApplyStagedUpdateInput;
  await applyStagedUpdate(payload);
}

const executedPath = process.argv[1]
  ? path.resolve(process.argv[1])
  : null;
const currentModulePath = path.resolve(fileURLToPath(import.meta.url));

if (executedPath === currentModulePath) {
  await main();
}
