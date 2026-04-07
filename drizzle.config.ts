import { dirname, resolve } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

const workspaceRoot = dirname(fileURLToPath(import.meta.url));
const webAppRoot = resolve(workspaceRoot, "apps/web");

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, "utf8");

  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();

    if (!key || process.env[key]) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(resolve(workspaceRoot, ".env.local"));
loadEnvFile(resolve(workspaceRoot, ".env"));
loadEnvFile(resolve(webAppRoot, ".env.local"));
loadEnvFile(resolve(webAppRoot, ".env"));

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required for Drizzle commands. Set it in /.env.local, /.env, /apps/web/.env.local, or /apps/web/.env."
  );
}

export default defineConfig({
  schema: resolve(workspaceRoot, "packages/db/src/schema.ts"),
  out: "drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: false,
});
