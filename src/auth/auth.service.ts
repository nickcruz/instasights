import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

import { APP_CONFIG, type AppConfig } from '../config/environment';
import type { InstagramCredential, OAuthState } from './auth.types';

const CREDENTIAL_VERSION = 'v1';
const GRAPH_ORIGIN = 'https://graph.instagram.com';

function base64Url(value: Buffer): string {
  return value.toString('base64url');
}

function decodeBase64Url(value: string): Buffer {
  const decoded = Buffer.from(value, 'base64url');
  if (!value || decoded.toString('base64url') !== value) {
    throw new Error('invalid base64url');
  }
  return decoded;
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function isCredential(value: unknown): value is InstagramCredential {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.accessToken === 'string' &&
    typeof payload.userId === 'string' &&
    typeof payload.username === 'string' &&
    typeof payload.proofChallenge === 'string' &&
    typeof payload.expiresAt === 'number'
  );
}

@Injectable()
export class AuthService {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  signState(input: Omit<OAuthState, 'expiresAt'>): string {
    const payload: OAuthState = {
      ...input,
      expiresAt: Date.now() + 10 * 60_000,
    };
    const body = base64Url(Buffer.from(JSON.stringify(payload)));
    const signature = base64Url(
      createHmac('sha256', this.config.encryptionKey).update(body).digest(),
    );
    return `${body}.${signature}`;
  }

  verifyState(value: string): OAuthState {
    const [body, signature, extra] = value.split('.');
    if (!body || !signature || extra) {
      throw new BadRequestException('Invalid OAuth state');
    }
    const expected = base64Url(
      createHmac('sha256', this.config.encryptionKey).update(body).digest(),
    );
    if (!safeEqual(signature, expected)) {
      throw new BadRequestException('Invalid OAuth state');
    }

    try {
      const payload = JSON.parse(decodeBase64Url(body).toString()) as OAuthState;
      if (
        !payload.redirectUri ||
        !payload.clientState ||
        !payload.proofChallenge ||
        !Number.isFinite(payload.expiresAt) ||
        payload.expiresAt < Date.now()
      ) {
        throw new Error('expired');
      }
      return payload;
    } catch {
      throw new BadRequestException('OAuth state is invalid or expired');
    }
  }

  issueCredential(
    input: Omit<InstagramCredential, 'expiresAt'> & { expiresInSeconds: number },
  ): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.config.encryptionKey, iv);
    cipher.setAAD(Buffer.from(CREDENTIAL_VERSION));
    const payload: InstagramCredential = {
      accessToken: input.accessToken,
      userId: input.userId,
      username: input.username,
      proofChallenge: input.proofChallenge,
      expiresAt: Date.now() + Math.max(60, input.expiresInSeconds) * 1_000,
    };
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(payload), 'utf8'),
      cipher.final(),
    ]);
    return [
      CREDENTIAL_VERSION,
      base64Url(iv),
      base64Url(cipher.getAuthTag()),
      base64Url(encrypted),
    ].join('.');
  }

  readCredential(value: string): InstagramCredential {
    try {
      const [version, iv, tag, encrypted, extra] = value.split('.');
      if (version !== CREDENTIAL_VERSION || !iv || !tag || !encrypted || extra) {
        throw new Error('invalid');
      }
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.config.encryptionKey,
        decodeBase64Url(iv),
      );
      decipher.setAAD(Buffer.from(CREDENTIAL_VERSION));
      decipher.setAuthTag(decodeBase64Url(tag));
      const payload: unknown = JSON.parse(
        Buffer.concat([
          decipher.update(decodeBase64Url(encrypted)),
          decipher.final(),
        ]).toString(),
      );
      if (!isCredential(payload) || payload.expiresAt < Date.now()) {
        throw new Error('expired');
      }
      return payload;
    } catch {
      throw new UnauthorizedException(
        'Credential is invalid or expired; log in again.',
      );
    }
  }

  verifyProof(credential: InstagramCredential, verifier: string): void {
    if (!/^[A-Za-z0-9_-]{43,128}$/.test(verifier)) {
      throw new UnauthorizedException('Credential proof is required');
    }
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    if (!safeEqual(challenge, credential.proofChallenge)) {
      throw new UnauthorizedException('Credential proof is invalid');
    }
  }

  authorizeUrl(state: string): string {
    const url = new URL('https://www.instagram.com/oauth/authorize');
    url.searchParams.set('client_id', this.config.appId);
    url.searchParams.set('redirect_uri', this.config.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set(
      'scope',
      'instagram_business_basic,instagram_business_manage_insights',
    );
    url.searchParams.set('force_reauth', 'true');
    url.searchParams.set('state', state);
    return url.toString();
  }

  async exchangeCode(code: string, proofChallenge: string): Promise<string> {
    const shortToken = await this.fetchShortToken(code);
    const longToken = await this.fetchLongToken(shortToken.accessToken);
    const profile = await this.fetchProfile(longToken.accessToken);
    return this.issueCredential({
      accessToken: longToken.accessToken,
      userId: profile.userId || shortToken.userId,
      username: profile.username,
      proofChallenge,
      expiresInSeconds: longToken.expiresIn,
    });
  }

  async refreshCredential(
    credential: InstagramCredential,
  ): Promise<{ credential: string }> {
    const url = new URL(`${GRAPH_ORIGIN}/refresh_access_token`);
    url.searchParams.set('grant_type', 'ig_refresh_token');
    url.searchParams.set('access_token', credential.accessToken);
    const payload = await this.fetchJson(url, { method: 'GET' });
    const accessToken = this.requiredString(payload, 'access_token');
    const expiresIn = this.optionalNumber(payload, 'expires_in') ?? 60 * 24 * 60 * 60;
    return {
      credential: this.issueCredential({
        accessToken,
        userId: credential.userId,
        username: credential.username,
        proofChallenge: credential.proofChallenge,
        expiresInSeconds: expiresIn,
      }),
    };
  }

  private async fetchShortToken(
    code: string,
  ): Promise<{ accessToken: string; userId: string }> {
    const form = new URLSearchParams({
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirectUri,
      code,
    });
    const payload = await this.fetchJson(
      new URL('https://api.instagram.com/oauth/access_token'),
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      },
    );
    return {
      accessToken: this.requiredString(payload, 'access_token'),
      userId:
        this.optionalString(payload, 'user_id') ??
        this.optionalString(payload, 'instagram_user_id') ??
        '',
    };
  }

  private async fetchLongToken(
    shortToken: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const url = new URL(`${GRAPH_ORIGIN}/access_token`);
    url.searchParams.set('grant_type', 'ig_exchange_token');
    url.searchParams.set('client_secret', this.config.appSecret);
    url.searchParams.set('access_token', shortToken);
    const payload = await this.fetchJson(url, { method: 'GET' });
    return {
      accessToken: this.requiredString(payload, 'access_token'),
      expiresIn: this.optionalNumber(payload, 'expires_in') ?? 60 * 24 * 60 * 60,
    };
  }

  private async fetchProfile(
    accessToken: string,
  ): Promise<{ userId: string; username: string }> {
    const url = new URL(`${GRAPH_ORIGIN}/${this.config.graphVersion}/me`);
    url.searchParams.set('fields', 'user_id,username');
    const payload = await this.fetchJson(url, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    return {
      userId:
        this.optionalString(payload, 'user_id') ??
        this.optionalString(payload, 'id') ??
        '',
      username: this.optionalString(payload, 'username') ?? '',
    };
  }

  private async fetchJson(
    url: URL,
    init: RequestInit,
  ): Promise<Record<string, unknown>> {
    let response: globalThis.Response;
    try {
      response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch {
      throw new BadGatewayException('Instagram authentication request failed');
    }

    const payload = (await response.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!response.ok || !payload) {
      const error = payload?.error as Record<string, unknown> | undefined;
      const message =
        this.optionalString(payload ?? {}, 'error_message') ??
        (error ? this.optionalString(error, 'message') : undefined) ??
        'Instagram authentication failed';
      throw new BadGatewayException(message);
    }
    return payload;
  }

  private requiredString(payload: Record<string, unknown>, key: string): string {
    const value = this.optionalString(payload, key);
    if (!value) throw new BadGatewayException(`Instagram omitted ${key}`);
    return value;
  }

  private optionalString(
    payload: Record<string, unknown>,
    key: string,
  ): string | undefined {
    const value = payload[key];
    return typeof value === 'string' ? value : undefined;
  }

  private optionalNumber(
    payload: Record<string, unknown>,
    key: string,
  ): number | undefined {
    const value = payload[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }
}
