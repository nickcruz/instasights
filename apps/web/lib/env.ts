import path from "node:path";

import { loadEnvConfig } from "@next/env";

let loaded = false;

function loadWorkspaceEnv() {
  if (loaded) {
    return;
  }

  loadEnvConfig(process.cwd());
  loadEnvConfig(path.resolve(process.cwd(), "../.."));
  loaded = true;
}

loadWorkspaceEnv();

export function getEnv(name: string) {
  loadWorkspaceEnv();
  return process.env[name];
}

export function getRequiredEnv(name: string) {
  const value = getEnv(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
