import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Response as ExpressResponse } from 'express';

import type { AppConfig } from '../src/config/environment';
import { InstagramService } from '../src/instagram/instagram.service';

type CapturedResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  response: ExpressResponse;
};

function captureResponse(): CapturedResponse {
  const captured: CapturedResponse = {
    statusCode: 200,
    headers: {},
    body: undefined,
    response: undefined as unknown as ExpressResponse,
  };
  captured.response = {
    status(code: number) {
      captured.statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      captured.headers[name.toLowerCase()] = value;
      return this;
    },
    json(body: unknown) {
      captured.body = body;
      return this;
    },
  } as unknown as ExpressResponse;
  return captured;
}

function config(): AppConfig {
  return {
    appId: 'app-id',
    appSecret: 'app-secret',
    redirectUri: 'https://api.example.test/auth/instagram/callback',
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

  test('uses bearer auth, preserves cursors, and strips upstream paging URLs', async () => {
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
          headers: {
            'content-type': 'application/json',
            'x-app-usage': '{"call_count":1}',
          },
        },
      ),
    ) as typeof fetch;
    const captured = captureResponse();
    const service = new InstagramService(config());

    await service.media(captured.response, 'secret', '123', {
      fields: 'id,caption',
      limit: '25',
      after: 'cursor',
    });

    const call = (global.fetch as jest.Mock).mock.calls[0] as [URL, RequestInit];
    expect(call[0].toString()).toContain('/v25.0/123/media?');
    expect(call[0].toString()).not.toContain('access_token');
    expect(call[1].headers).toEqual({ authorization: 'Bearer secret' });
    expect(captured.headers['x-app-usage']).toBe('{"call_count":1}');
    expect(captured.body).toEqual({
      data: [{ id: '1' }],
      paging: { cursors: { before: 'before', after: 'after' } },
    });
  });

  test('rejects unknown fields and query parameters before calling Instagram', async () => {
    global.fetch = jest.fn() as typeof fetch;
    const service = new InstagramService(config());
    const captured = captureResponse();

    await expect(
      service.profile(captured.response, 'secret', { fields: 'id,access_token' }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.media(captured.response, 'secret', '123', { arbitrary: 'value' }),
    ).rejects.toThrow('Unsupported query parameter');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('preserves upstream status and sanitized errors', async () => {
    global.fetch = jest.fn(async () =>
      new Response(
        JSON.stringify({
          error: {
            message: 'Rate limited',
            type: 'OAuthException',
            code: 4,
            private_detail: 'do-not-return',
          },
        }),
        { status: 429, headers: { 'retry-after': '30' } },
      ),
    ) as typeof fetch;
    const captured = captureResponse();
    const service = new InstagramService(config());

    await service.profile(captured.response, 'secret', { fields: 'id' });

    expect(captured.statusCode).toBe(429);
    expect(captured.headers['retry-after']).toBe('30');
    expect(captured.body).toEqual({
      error: { message: 'Rate limited', type: 'OAuthException', code: 4 },
    });
  });

  test('maps request timeouts to 504', async () => {
    global.fetch = jest.fn(async () => {
      throw new DOMException('timed out', 'TimeoutError');
    }) as typeof fetch;
    const captured = captureResponse();
    const service = new InstagramService(config());

    await service.profile(captured.response, 'secret', { fields: 'id' });
    expect(captured.statusCode).toBe(504);
    expect(captured.body).toEqual({
      error: { message: 'Instagram request timed out' },
    });
  });
});
