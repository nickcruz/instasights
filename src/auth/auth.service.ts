import { BadGatewayException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

import { APP_CONFIG, type AppConfig } from '../config/environment';
import {
  MCP_SCOPE,
  type InstagramSession,
  type McpCredential,
  type OAuthAuthorizationCode,
  OAuthError,
  type OAuthClient,
  type OAuthPending,
} from './auth.types';

const GRAPH_ORIGIN = 'https://graph.instagram.com';
const TOKEN_VERSION = 'v1';
const CLIENT_PREFIX = 'mcp_client_';
const STATE_PREFIX = 'mcp_state_';
const CODE_PREFIX = 'mcp_code_';
const ACCESS_PREFIX = 'mcp_access_';
const STATE_TTL_MS = 10 * 60_000;
const CODE_TTL_MS = 5 * 60_000;
const MAX_CONSUMED_CODES = 10_000;
const LEGACY_CLIENT_ID = /^mcp_client_[A-Za-z0-9_-]{16,160}$/;

function decodeBase64Url(value: string): Buffer {
  const decoded = Buffer.from(value, 'base64url');
  if (!value || decoded.toString('base64url') !== value) {
    throw new Error('invalid base64url');
  }
  return decoded;
}

function constantTimeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new OAuthError('invalid_request', 'A JSON object is required');
  }
  return value as Record<string, unknown>;
}

function stringValue(
  source: Record<string, unknown>,
  key: string,
  maximum = 4096,
  required = true,
): string | undefined {
  const value = source[key];
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || !value || value.length > maximum) {
    throw new OAuthError('invalid_request', `${key} is invalid`);
  }
  return value;
}

@Injectable()
export class AuthService {
  private readonly consumedCodes = new Map<string, number>();

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  resourceUrl(): string {
    return `${this.config.publicUrl}/mcp`;
  }

  registerClient(input: unknown): Record<string, unknown> {
    const body = record(input);
    const values = body.redirect_uris;
    if (!Array.isArray(values) || values.length < 1 || values.length > 10) {
      throw new OAuthError(
        'invalid_client_metadata',
        'redirect_uris must contain between 1 and 10 URLs',
      );
    }
    const redirectUris = [
      ...new Set(values.map((value) => this.validateRedirectUri(value))),
    ];
    if (
      body.token_endpoint_auth_method !== undefined &&
      body.token_endpoint_auth_method !== 'none'
    ) {
      throw new OAuthError(
        'invalid_client_metadata',
        'Only public clients using token_endpoint_auth_method=none are supported',
      );
    }
    const issuedAt = Math.floor(Date.now() / 1000);
    const clientId = `${CLIENT_PREFIX}${this.seal('client', {
      redirectUris,
      issuedAt,
    })}`;
    return {
      client_id: clientId,
      client_id_issued_at: issuedAt,
      client_name:
        typeof body.client_name === 'string'
          ? body.client_name.slice(0, 200)
          : 'MCP client',
      redirect_uris: redirectUris,
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    };
  }

  createInstagramAuthorization(input: Record<string, unknown>): string {
    if (stringValue(input, 'response_type', 32) !== 'code') {
      throw new OAuthError(
        'unsupported_response_type',
        'Only response_type=code is supported',
      );
    }
    const clientId = stringValue(input, 'client_id', 16_384) as string;
    const redirectUri = this.validateRedirectUri(
      stringValue(input, 'redirect_uri') as string,
    );
    const client = this.readClient(clientId, redirectUri);
    if (!client.redirectUris.includes(redirectUri)) {
      throw new OAuthError(
        'invalid_request',
        'redirect_uri is not registered for this client',
      );
    }
    const codeChallenge = stringValue(input, 'code_challenge', 128) as string;
    if (!/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge)) {
      throw new OAuthError('invalid_request', 'code_challenge is invalid');
    }
    if (stringValue(input, 'code_challenge_method', 16) !== 'S256') {
      throw new OAuthError(
        'invalid_request',
        'Only code_challenge_method=S256 is supported',
      );
    }
    const scope =
      stringValue(input, 'scope', 256, false) ?? MCP_SCOPE;
    if (scope !== MCP_SCOPE) {
      throw new OAuthError('invalid_scope', `Only ${MCP_SCOPE} is supported`);
    }
    // Older Claude clients omit RFC 8707 resource. Treat the canonical MCP URL
    // as the only possible default; reject every explicit alternative.
    const resource =
      stringValue(input, 'resource', 4096, false) ?? this.resourceUrl();
    if (resource !== this.resourceUrl()) {
      throw new OAuthError(
        'invalid_target',
        'resource must identify this MCP server',
      );
    }
    const clientState = stringValue(input, 'state', 2048, false);
    if (clientState && /[^\x20-\x7E]/.test(clientState)) {
      throw new OAuthError('invalid_request', 'state is invalid');
    }

    const pending: OAuthPending = {
      clientId,
      redirectUri,
      codeChallenge,
      resource,
      scope,
      ...(clientState ? { clientState } : {}),
      expiresAt: Date.now() + STATE_TTL_MS,
    };
    const state = `${STATE_PREFIX}${this.seal('state', pending)}`;
    return this.instagramAuthorizeUrl(state);
  }

  async completeInstagramAuthorization(input: {
    state: string;
    code?: string;
    error?: string;
    errorDescription?: string;
  }): Promise<string> {
    let pending: OAuthPending;
    try {
      pending = this.openWithPrefix<OAuthPending>(
        input.state,
        STATE_PREFIX,
        'state',
      );
    } catch {
      throw new OAuthError(
        'invalid_request',
        'OAuth state is invalid or expired',
      );
    }
    if (!this.validPending(pending) || pending.expiresAt < Date.now()) {
      throw new OAuthError(
        'invalid_request',
        'OAuth state is invalid or expired',
      );
    }
    const destination = new URL(pending.redirectUri);
    if (pending.clientState) {
      destination.searchParams.set('state', pending.clientState);
    }
    if (input.error || !input.code) {
      destination.searchParams.set('error', input.error || 'access_denied');
      destination.searchParams.set(
        'error_description',
        input.errorDescription || 'Instagram authorization was cancelled',
      );
      return destination.toString();
    }

    try {
      const instagram = await this.exchangeInstagramCode(input.code);
      const authorizationCode: OAuthAuthorizationCode = {
        ...pending,
        ...instagram,
        nonce: randomBytes(24).toString('base64url'),
        codeExpiresAt: Date.now() + CODE_TTL_MS,
      };
      destination.searchParams.set(
        'code',
        `${CODE_PREFIX}${this.seal('code', authorizationCode)}`,
      );
    } catch {
      destination.searchParams.set('error', 'server_error');
      destination.searchParams.set(
        'error_description',
        'Instagram authorization failed',
      );
    }
    return destination.toString();
  }

  exchangeAuthorizationCode(input: unknown): Record<string, unknown> {
    const body = record(input);
    if (stringValue(body, 'grant_type', 64) !== 'authorization_code') {
      throw new OAuthError(
        'unsupported_grant_type',
        'Only authorization_code is supported',
      );
    }
    const clientId = stringValue(body, 'client_id', 16_384) as string;
    const redirectUri = this.validateRedirectUri(
      stringValue(body, 'redirect_uri') as string,
    );
    this.readClient(clientId, redirectUri);
    const verifier = stringValue(body, 'code_verifier', 128) as string;
    if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) {
      throw new OAuthError('invalid_grant', 'code_verifier is invalid');
    }
    let code: OAuthAuthorizationCode;
    try {
      code = this.openWithPrefix<OAuthAuthorizationCode>(
        stringValue(body, 'code', 32_768) as string,
        CODE_PREFIX,
        'code',
      );
    } catch {
      throw new OAuthError(
        'invalid_grant',
        'Authorization code is invalid or expired',
      );
    }
    if (
      !this.validAuthorizationCode(code) ||
      code.codeExpiresAt < Date.now() ||
      code.expiresAt < Date.now() ||
      !constantTimeEqual(code.clientId, clientId) ||
      !constantTimeEqual(code.redirectUri, redirectUri)
    ) {
      throw new OAuthError(
        'invalid_grant',
        'Authorization code is invalid or expired',
      );
    }
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    if (!constantTimeEqual(challenge, code.codeChallenge)) {
      throw new OAuthError('invalid_grant', 'PKCE verification failed');
    }
    const resource =
      stringValue(body, 'resource', 4096, false) ?? code.resource;
    if (resource !== code.resource || resource !== this.resourceUrl()) {
      throw new OAuthError('invalid_target', 'resource is invalid');
    }
    if (!this.consumeCode(code.nonce, code.codeExpiresAt)) {
      throw new OAuthError(
        'invalid_grant',
        'Authorization code is invalid or already used',
      );
    }

    const credential: McpCredential = {
      accessToken: code.accessToken,
      userId: code.userId,
      username: code.username,
      expiresAt: code.expiresAt,
      audience: code.resource,
      scope: code.scope,
    };
    return {
      access_token: `${ACCESS_PREFIX}${this.seal('access', credential)}`,
      token_type: 'Bearer',
      expires_in: Math.max(
        1,
        Math.floor((credential.expiresAt - Date.now()) / 1000),
      ),
      scope: credential.scope,
    };
  }

  readMcpCredential(token: string): McpCredential {
    try {
      const credential = this.openWithPrefix<McpCredential>(
        token,
        ACCESS_PREFIX,
        'access',
      );
      if (
        !this.validInstagramSession(credential) ||
        credential.expiresAt < Date.now() ||
        credential.audience !== this.resourceUrl() ||
        credential.scope !== MCP_SCOPE
      ) {
        throw new Error('invalid');
      }
      return credential;
    } catch {
      throw new UnauthorizedException('MCP access token is invalid or expired');
    }
  }

  private readClient(clientId: string, requestedRedirect: string): OAuthClient {
    // Compatibility for clients registered by the retired OAuth implementation.
    // Dynamic registration is public, so accepting the old opaque ID shape with
    // the same strict redirect validation does not grant additional privilege.
    if (LEGACY_CLIENT_ID.test(clientId) && !clientId.startsWith(`${CLIENT_PREFIX}${TOKEN_VERSION}.`)) {
      return { redirectUris: [requestedRedirect], issuedAt: 0 };
    }
    try {
      const client = this.openWithPrefix<OAuthClient>(
        clientId,
        CLIENT_PREFIX,
        'client',
      );
      if (
        !Array.isArray(client.redirectUris) ||
        client.redirectUris.length < 1 ||
        client.redirectUris.some((uri) => typeof uri !== 'string') ||
        !Number.isFinite(client.issuedAt)
      ) {
        throw new Error('invalid');
      }
      return client;
    } catch {
      throw new OAuthError('invalid_client', 'client_id is invalid', 401);
    }
  }

  private validateRedirectUri(value: unknown): string {
    if (typeof value !== 'string' || !value || value.length > 4096) {
      throw new OAuthError('invalid_redirect_uri', 'redirect_uri is invalid');
    }
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new OAuthError('invalid_redirect_uri', 'redirect_uri is invalid');
    }
    const loopback = ['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname);
    if (
      url.username ||
      url.password ||
      url.hash ||
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback))
    ) {
      throw new OAuthError(
        'invalid_redirect_uri',
        'redirect_uri must use HTTPS or an HTTP loopback address',
      );
    }
    return url.toString();
  }

  private consumeCode(nonce: string, expiresAt: number): boolean {
    const now = Date.now();
    for (const [value, expiry] of this.consumedCodes) {
      if (expiry <= now) this.consumedCodes.delete(value);
    }
    if (
      !/^[A-Za-z0-9_-]{32}$/.test(nonce) ||
      expiresAt <= now ||
      this.consumedCodes.has(nonce)
    ) {
      return false;
    }
    if (this.consumedCodes.size >= MAX_CONSUMED_CODES) {
      const oldest = this.consumedCodes.keys().next().value as string | undefined;
      if (oldest) this.consumedCodes.delete(oldest);
    }
    this.consumedCodes.set(nonce, expiresAt);
    return true;
  }

  private seal(kind: string, payload: unknown): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.config.encryptionKey, iv);
    cipher.setAAD(Buffer.from(`${TOKEN_VERSION}:${kind}`));
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(payload), 'utf8'),
      cipher.final(),
    ]);
    return [
      TOKEN_VERSION,
      iv.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      encrypted.toString('base64url'),
    ].join('.');
  }

  private openWithPrefix<T>(value: string, prefix: string, kind: string): T {
    if (!value.startsWith(prefix)) throw new Error('invalid prefix');
    const parts = value.slice(prefix.length).split('.');
    if (parts.length !== 4 || parts[0] !== TOKEN_VERSION) {
      throw new Error('invalid token');
    }
    const [, iv, tag, encrypted] = parts;
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.config.encryptionKey,
      decodeBase64Url(iv),
    );
    decipher.setAAD(Buffer.from(`${TOKEN_VERSION}:${kind}`));
    decipher.setAuthTag(decodeBase64Url(tag));
    return JSON.parse(
      Buffer.concat([
        decipher.update(decodeBase64Url(encrypted)),
        decipher.final(),
      ]).toString(),
    ) as T;
  }

  private validPending(value: OAuthPending): boolean {
    return (
      typeof value.clientId === 'string' &&
      typeof value.redirectUri === 'string' &&
      typeof value.codeChallenge === 'string' &&
      typeof value.resource === 'string' &&
      value.scope === MCP_SCOPE &&
      Number.isFinite(value.expiresAt)
    );
  }

  private validAuthorizationCode(value: OAuthAuthorizationCode): boolean {
    return (
      this.validPending(value) &&
      this.validInstagramSession(value) &&
      typeof value.nonce === 'string' &&
      Number.isFinite(value.codeExpiresAt)
    );
  }

  private validInstagramSession(value: InstagramSession): boolean {
    return (
      typeof value.accessToken === 'string' &&
      typeof value.userId === 'string' &&
      typeof value.username === 'string' &&
      Number.isFinite(value.expiresAt)
    );
  }

  private instagramAuthorizeUrl(state: string): string {
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

  private async exchangeInstagramCode(code: string): Promise<InstagramSession> {
    const shortToken = await this.fetchShortToken(code);
    const longToken = await this.fetchLongToken(shortToken.accessToken);
    const profile = await this.fetchProfile(longToken.accessToken);
    return {
      accessToken: longToken.accessToken,
      userId: profile.userId || shortToken.userId,
      username: profile.username,
      expiresAt: Date.now() + Math.max(60, longToken.expiresIn) * 1000,
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
      accessToken: this.requiredGraphString(payload, 'access_token'),
      userId:
        this.optionalGraphString(payload, 'user_id') ??
        this.optionalGraphString(payload, 'instagram_user_id') ??
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
      accessToken: this.requiredGraphString(payload, 'access_token'),
      expiresIn:
        this.optionalGraphNumber(payload, 'expires_in') ?? 60 * 24 * 60 * 60,
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
        this.optionalGraphString(payload, 'user_id') ??
        this.optionalGraphString(payload, 'id') ??
        '',
      username: this.optionalGraphString(payload, 'username') ?? '',
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
      // Upstream bodies may echo credentials or authorization codes.
      throw new BadGatewayException('Instagram authentication failed');
    }
    return payload;
  }

  private requiredGraphString(
    payload: Record<string, unknown>,
    key: string,
  ): string {
    const value = this.optionalGraphString(payload, key);
    if (!value) throw new BadGatewayException(`Instagram omitted ${key}`);
    return value;
  }

  private optionalGraphString(
    payload: Record<string, unknown>,
    key: string,
  ): string | undefined {
    const value = payload[key];
    return typeof value === 'string' ? value : undefined;
  }

  private optionalGraphNumber(
    payload: Record<string, unknown>,
    key: string,
  ): number | undefined {
    const value = payload[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }
}
