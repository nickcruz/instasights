import { UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

import { AuthService } from '../src/auth/auth.service';
import type { AppConfig } from '../src/config/environment';
import {
  validateClientState,
  validateLoopbackRedirect,
  validateProofChallenge,
} from '../src/auth/loopback';

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

describe('AuthService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('signs expiring OAuth state and rejects tampering', () => {
    const service = new AuthService(config());
    const state = service.signState({
      redirectUri: 'http://127.0.0.1:49152/callback',
      clientState: 'a'.repeat(32),
      proofChallenge: 'b'.repeat(43),
    });
    expect(service.verifyState(state)).toMatchObject({
      clientState: 'a'.repeat(32),
      proofChallenge: 'b'.repeat(43),
    });
    expect(() => service.verifyState(`${state}x`)).toThrow('Invalid OAuth state');
  });

  test('exchanges the code for a long-lived token without exposing it', async () => {
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
    const service = new AuthService(config());
    const opaque = await service.exchangeCode('authorization-code', 'b'.repeat(43));

    expect(opaque).not.toContain('long-token');
    expect(service.readCredential(opaque)).toMatchObject({
      accessToken: 'long-token',
      userId: '123',
      username: 'creator',
    });
    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(String(calls[1][0])).toContain('grant_type=ig_exchange_token');
    expect(calls[2][1].headers).toEqual({ authorization: 'Bearer long-token' });
  });

  test('encrypts credentials and binds them to the local verifier', () => {
    const service = new AuthService(config());
    const verifier = randomBytes(32).toString('base64url');
    const proofChallenge = createHash('sha256')
      .update(verifier)
      .digest('base64url');
    const opaque = service.issueCredential({
      accessToken: 'instagram-secret-token',
      userId: '123',
      username: 'creator',
      proofChallenge,
      expiresInSeconds: 3600,
    });

    expect(opaque).not.toContain('instagram-secret-token');
    const credential = service.readCredential(opaque);
    expect(credential).toMatchObject({ userId: '123', username: 'creator' });
    expect(() => service.verifyProof(credential, verifier)).not.toThrow();
    expect(() => service.verifyProof(credential, randomBytes(32).toString('base64url')))
      .toThrow(UnauthorizedException);
    expect(() => service.readCredential(`${opaque}x`)).toThrow(
      UnauthorizedException,
    );
  });
});

describe('loopback validation', () => {
  test('accepts only literal IPv4 loopback callbacks', () => {
    expect(validateLoopbackRedirect('http://127.0.0.1:49152/callback')).toBe(
      'http://127.0.0.1:49152/callback',
    );
    for (const value of [
      'https://127.0.0.1:49152/callback',
      'http://localhost:49152/callback',
      'http://example.com:49152/callback',
      'http://127.0.0.1/callback',
      'http://127.0.0.1:49152/callback?next=evil',
    ]) {
      expect(() => validateLoopbackRedirect(value)).toThrow();
    }
  });

  test('validates client state and proof challenge shapes', () => {
    expect(validateClientState('a'.repeat(32))).toHaveLength(32);
    expect(validateProofChallenge('b'.repeat(43))).toHaveLength(43);
    expect(() => validateClientState('short')).toThrow();
    expect(() => validateProofChallenge('bad')).toThrow();
  });
});
