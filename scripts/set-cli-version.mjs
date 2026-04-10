import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

function getRequiredArg(name) {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  const value = index === -1 ? null : process.argv[index + 1] ?? null;

  if (!value) {
    throw new Error(`Missing required argument: --${name}`);
  }

  return value;
}

async function updateJsonFile(filePath, updater) {
  const current = await readFile(filePath, "utf8");
  const updated = updater(JSON.parse(current));
  await writeFile(filePath, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
}

const nextVersion = getRequiredArg("version");

await updateJsonFile(resolve("packages/cli/package.json"), (parsed) => ({
  ...parsed,
  version: nextVersion,
}));

for (const pluginFile of [
  resolve(".plugin/plugin.json"),
  resolve(".claude-plugin/plugin.json"),
]) {
  await updateJsonFile(pluginFile, (parsed) => ({
    ...parsed,
    version: nextVersion,
  }));
}

for (const marketplaceFile of [
  resolve(".plugin/marketplace.json"),
  resolve(".claude-plugin/marketplace.json"),
]) {
  await updateJsonFile(marketplaceFile, (parsed) => ({
    ...parsed,
    plugins: Array.isArray(parsed.plugins)
      ? parsed.plugins.map((plugin) => ({
          ...plugin,
          version: nextVersion,
        }))
      : parsed.plugins,
  }));
}

console.log(`Updated CLI version to ${nextVersion}`);
