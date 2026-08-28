import { randomBytes } from 'node:crypto';

import { loadEnvironment } from '../src/config/environment';

const originalEnvironment = { ...process.env };

beforeEach(() => {
  process.env = {
    ...originalEnvironment,
    INSTAGRAM_APP_ID: 'app-id',
    INSTAGRAM_APP_SECRET: 'app-secret',
    INSTAGRAM_REDIRECT_URI: 'https://api.example.test/auth/instagram/callback',
    PUBLIC_APP_URL: 'https://api.example.test',
    GRAPH_API_VERSION: 'v25.0',
    CREDENTIAL_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
    REQUEST_TIMEOUT_MS: '15000',
  };
});

afterAll(() => {
  process.env = originalEnvironment;
});

test('loads and validates production configuration', () => {
  const config = loadEnvironment();
  expect(config.encryptionKey).toHaveLength(32);
  expect(config.graphVersion).toBe('v25.0');
  expect(config.timeoutMs).toBe(15_000);
});

test('fails fast for missing or malformed configuration', () => {
  delete process.env.INSTAGRAM_APP_SECRET;
  expect(() => loadEnvironment()).toThrow('INSTAGRAM_APP_SECRET is required');

  process.env.INSTAGRAM_APP_SECRET = 'secret';
  process.env.GRAPH_API_VERSION = 'latest';
  expect(() => loadEnvironment()).toThrow('GRAPH_API_VERSION');
});
