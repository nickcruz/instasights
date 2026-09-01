import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

import type { AppConfig } from '../src/config/environment';
import { InstagramService } from '../src/instagram/instagram.service';

function config(): AppConfig {
  return {
    appId: 'app-id',
    appSecret: 'app-secret',
    redirectUri: 'https://api.example.test/api/callback',
    publicUrl: 'https://api.example.test',
    graphVersion: 'v25.0',
    encryptionKey: randomBytes(32),
    timeoutMs: 5_000,
  };
}

describe('InstagramService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('uses bearer auth, preserves cursors, and strips paging URLs', async () => {
    global.fetch = jest.fn(async () =>
      new Response(
        JSON.stringify({
          data: [{ id: '1' }],
          paging: {
            cursors: { before: 'before', after: 'after' },
            next: 'https://graph.instagram.com/next?access_token=secret',
          },
        }),
        {
          status: 200,
          headers: { 'x-app-usage': '{"call_count":1}' },
        },
      ),
    ) as typeof fetch;
    const service = new InstagramService(config());
    const result = await service.media('secret', '123', {
      fields: 'id,caption',
      limit: '25',
      after: 'cursor',
    });

    const call = (global.fetch as jest.Mock).mock.calls[0] as [URL, RequestInit];
    expect(String(call[0])).toContain('/v25.0/123/media?');
    expect(String(call[0])).not.toContain('access_token');
    expect(call[1].headers).toEqual({ authorization: 'Bearer secret' });
    expect(result).toEqual({
      status: 200,
      rateLimit: { 'x-app-usage': '{"call_count":1}' },
      body: {
        data: [{ id: '1' }],
        paging: { cursors: { before: 'before', after: 'after' } },
      },
    });
  });

  test('rejects unknown fields and parameters before calling Instagram', async () => {
    global.fetch = jest.fn() as typeof fetch;
    const service = new InstagramService(config());

    await expect(
      service.profile('secret', { fields: 'id,access_token' }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.media('secret', '123', { arbitrary: 'value' }),
    ).rejects.toThrow('Unsupported query parameter');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('preserves status and rate limits while sanitizing upstream errors', async () => {
    global.fetch = jest.fn(async () =>
      new Response(
        JSON.stringify({
          error: {
            message: 'May echo a token',
            type: 'OAuthException',
            code: 4,
            private_detail: 'do-not-return',
          },
        }),
        { status: 429, headers: { 'retry-after': '30' } },
      ),
    ) as typeof fetch;
    const service = new InstagramService(config());
    const result = await service.profile('secret', { fields: 'id' });

    expect(result).toEqual({
      status: 429,
      rateLimit: { 'retry-after': '30' },
      body: {
        error: {
          message: 'Instagram request failed with status 429',
          type: 'OAuthException',
          code: 4,
        },
      },
    });
    expect(JSON.stringify(result)).not.toContain('do-not-return');
    expect(JSON.stringify(result)).not.toContain('May echo a token');
  });

  test('maps timeouts without throwing token-bearing errors', async () => {
    global.fetch = jest.fn(async () => {
      throw new DOMException('timed out with token=secret', 'TimeoutError');
    }) as typeof fetch;
    const service = new InstagramService(config());
    await expect(service.profile('secret', { fields: 'id' })).resolves.toEqual({
      status: 504,
      rateLimit: {},
      body: { error: { message: 'Instagram request timed out' } },
    });
  });
});
