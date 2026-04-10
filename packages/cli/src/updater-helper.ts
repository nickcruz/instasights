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

function parseArg(flag: string, argv = process.argv) {
  const index = argv.indexOf(flag);
  return index === -1 ? null : argv[index + 1] ?? null;
}

function getRequiredArg(flag: string, argv = process.argv) {
  const value = parseArg(flag, argv);

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

    if (!target.endsWith(".json")) {
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

export async function runUpdaterHelperMain(argv = process.argv) {
  const payloadPath = getRequiredArg("--payload", argv);
  const payload = JSON.parse(await readFile(payloadPath, "utf8")) as ApplyStagedUpdateInput;
  await applyStagedUpdate(payload);
}
