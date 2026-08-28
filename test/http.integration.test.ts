import { type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomBytes } from 'node:crypto';

import { AppModule } from '../src/app.module';

describe('Nest HTTP contract', () => {
  let app: INestApplication;
  let baseUrl: string;
  const realFetch = global.fetch;

  beforeAll(async () => {
    process.env.INSTAGRAM_APP_ID = 'app-id';
    process.env.INSTAGRAM_APP_SECRET = 'app-secret';
    process.env.INSTAGRAM_REDIRECT_URI =
      'https://api.example.test/auth/instagram/callback';
    process.env.PUBLIC_APP_URL = 'https://api.example.test';
    process.env.GRAPH_API_VERSION = 'v25.0';
    process.env.CREDENTIAL_ENCRYPTION_KEY = randomBytes(32).toString('base64');
    process.env.REQUEST_TIMEOUT_MS = '5000';

    app = await NestFactory.create(AppModule, { logger: false });
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  test('health is public and analytics require credential plus proof', async () => {
    const health = await realFetch(`${baseUrl}/health`);
    expect(health.status).toBe(200);
    await expect(health.json()).resolves.toEqual({
      ok: true,
      service: 'instasights',
    });

    const analytics = await realFetch(`${baseUrl}/v1/instagram/me`);
    expect(analytics.status).toBe(401);
  });

  test('OAuth start accepts only loopback callbacks', async () => {
    const query = new URLSearchParams({
      redirect_uri: 'http://127.0.0.1:49152/callback',
      state: 'a'.repeat(32),
      code_challenge: 'b'.repeat(43),
    });
    const valid = await realFetch(`${baseUrl}/auth/instagram/start?${query}`, {
      redirect: 'manual',
    });
    expect(valid.status).toBe(302);
    expect(new URL(valid.headers.get('location') ?? '').hostname).toBe(
      'www.instagram.com',
    );

    query.set('redirect_uri', 'http://example.com:49152/callback');
    const invalid = await realFetch(`${baseUrl}/auth/instagram/start?${query}`, {
      redirect: 'manual',
    });
    expect(invalid.status).toBe(400);
  });

  test('OAuth callback returns proof-bound credential via POST form, not URL', async () => {
    const query = new URLSearchParams({
      redirect_uri: 'http://127.0.0.1:49152/callback',
      state: 'c'.repeat(32),
      code_challenge: 'd'.repeat(43),
    });
    const start = await realFetch(`${baseUrl}/auth/instagram/start?${query}`, {
      redirect: 'manual',
    });
    const instagramLocation = new URL(start.headers.get('location') ?? '');
    const signedState = instagramLocation.searchParams.get('state');
    expect(signedState).toBeTruthy();

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'short-token', user_id: '123' }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'long-token', expires_in: 5000 }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user_id: '123', username: 'creator' }), {
          status: 200,
        }),
      ) as typeof fetch;

    const callback = await realFetch(
      `${baseUrl}/auth/instagram/callback?code=code&state=${encodeURIComponent(signedState ?? '')}`,
      { redirect: 'manual' },
    );
    const html = await callback.text();
    expect(callback.status).toBe(200);
    expect(callback.headers.get('content-security-policy')).toContain(
      "default-src 'none'",
    );
    expect(html).toContain('method="post"');
    expect(html).toContain('http://127.0.0.1:49152/callback');
    expect(html).not.toContain('long-token');
    expect(callback.headers.get('location')).toBeNull();
  });
});
