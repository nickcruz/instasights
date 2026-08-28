import { createHash } from 'node:crypto';

export const APP_CONFIG = Symbol('APP_CONFIG');

export type AppConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
  publicUrl: string;
  graphVersion: string;
  encryptionKey: Buffer;
  timeoutMs: number;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function httpUrl(name: string): string {
  const value = required(name);
  const url = new URL(value);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`${name} must be an HTTP(S) URL`);
  }
  return url.toString().replace(/\/$/, '');
}

function encryptionKey(): Buffer {
  const encoded = required('CREDENTIAL_ENCRYPTION_KEY');
  const decoded = Buffer.from(encoded, 'base64');
  if (decoded.length === 32 && decoded.toString('base64').replace(/=+$/, '') === encoded.replace(/=+$/, '')) {
    return decoded;
  }

  // Preserve a clear upgrade path for existing long random secrets without
  // accepting short development placeholders.
  if (encoded.length >= 32) {
    return createHash('sha256').update(encoded).digest();
  }
  throw new Error('CREDENTIAL_ENCRYPTION_KEY must be 32 random bytes encoded as base64');
}

export function loadEnvironment(): AppConfig {
  const graphVersion = process.env.GRAPH_API_VERSION?.trim() || 'v25.0';
  if (!/^v\d+\.\d+$/.test(graphVersion)) {
    throw new Error('GRAPH_API_VERSION must look like v25.0');
  }

  const timeoutMs = Number(process.env.REQUEST_TIMEOUT_MS || 15_000);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 60_000) {
    throw new Error('REQUEST_TIMEOUT_MS must be an integer between 1000 and 60000');
  }

  return {
    appId: required('INSTAGRAM_APP_ID'),
    appSecret: required('INSTAGRAM_APP_SECRET'),
    redirectUri: httpUrl('INSTAGRAM_REDIRECT_URI'),
    publicUrl: httpUrl('PUBLIC_APP_URL'),
    graphVersion,
    encryptionKey: encryptionKey(),
    timeoutMs,
  };
}
