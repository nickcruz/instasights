import { type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createHash, randomBytes } from 'node:crypto';

import { AppModule } from '../src/app.module';
import { MCP_SCOPE } from '../src/auth/auth.types';

const realFetch = global.fetch;

type RegisteredClient = { client_id: string; redirect_uris: string[] };
type TokenResponse = { access_token: string; token_type: string; scope: string };

describe('MCP OAuth and protocol contract', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.INSTAGRAM_APP_ID = 'app-id';
    process.env.INSTAGRAM_APP_SECRET = 'app-secret';
    process.env.INSTAGRAM_REDIRECT_URI = 'https://api.example.test/api/callback';
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

  async function register(
    redirectUri = 'http://127.0.0.1:8787/callback',
  ): Promise<RegisteredClient> {
    const response = await realFetch(`${baseUrl}/oauth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_name: 'Claude Code',
        redirect_uris: [redirectUri],
        token_endpoint_auth_method: 'none',
      }),
    });
    expect(response.status).toBe(201);
    return (await response.json()) as RegisteredClient;
  }

  function instagramResponses(): void {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: 'short-instagram-token', user_id: '123' }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: 'long-instagram-token', expires_in: 3600 }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ user_id: '123', username: 'creator' }),
          { status: 200 },
        ),
      ) as typeof fetch;
  }

  async function authorizationCode(input?: {
    clientId?: string;
    redirectUri?: string;
    verifier?: string;
    resource?: string | null;
  }): Promise<{
    code: string;
    clientId: string;
    redirectUri: string;
    verifier: string;
  }> {
    const redirectUri = input?.redirectUri ?? 'http://127.0.0.1:8787/callback';
    const client = input?.clientId
      ? { client_id: input.clientId }
      : await register(redirectUri);
    const verifier =
      input?.verifier ?? randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const query = new URLSearchParams({
      response_type: 'code',
      client_id: client.client_id,
      redirect_uri: redirectUri,
      scope: MCP_SCOPE,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state: 'client-state',
    });
    if (input?.resource !== null) {
      query.set('resource', input?.resource ?? 'https://api.example.test/mcp');
    }
    const authorize = await realFetch(`${baseUrl}/oauth/authorize?${query}`, {
      redirect: 'manual',
    });
    expect(authorize.status).toBe(302);
    const instagram = new URL(authorize.headers.get('location') ?? '');
    expect(instagram.hostname).toBe('www.instagram.com');
    expect(instagram.searchParams.get('redirect_uri')).toBe(
      'https://api.example.test/api/callback',
    );
    const serverState = instagram.searchParams.get('state');
    expect(serverState).toBeTruthy();

    instagramResponses();
    const callback = await realFetch(
      `${baseUrl}/api/callback?code=instagram-code&state=${encodeURIComponent(serverState ?? '')}`,
      { redirect: 'manual' },
    );
    expect(callback.status).toBe(302);
    const destination = new URL(callback.headers.get('location') ?? '');
    expect(destination.origin + destination.pathname).toBe(redirectUri);
    expect(destination.searchParams.get('state')).toBe('client-state');
    const code = destination.searchParams.get('code');
    expect(code).toMatch(/^mcp_code_/);
    expect(code).not.toContain('long-instagram-token');
    return { code: code ?? '', clientId: client.client_id, redirectUri, verifier };
  }

  async function redeem(
    input: Awaited<ReturnType<typeof authorizationCode>>,
    verifier = input.verifier,
  ): Promise<Response> {
    return realFetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: input.clientId,
        redirect_uri: input.redirectUri,
        code: input.code,
        code_verifier: verifier,
        resource: 'https://api.example.test/mcp',
      }),
    });
  }

  async function accessToken(): Promise<string> {
    const pending = await authorizationCode();
    const response = await redeem(pending);
    expect(response.status).toBe(200);
    const body = (await response.json()) as TokenResponse;
    expect(body.token_type).toBe('Bearer');
    expect(body.scope).toBe(MCP_SCOPE);
    expect(body.access_token).toMatch(/^mcp_access_/);
    expect(body.access_token).not.toContain('long-instagram-token');
    return body.access_token;
  }

  async function mcp(token: string, body: Record<string, unknown>): Promise<Response> {
    return realFetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  test('publishes protected-resource and authorization-server metadata', async () => {
    const resource = await realFetch(
      `${baseUrl}/.well-known/oauth-protected-resource/mcp`,
    );
    expect(resource.status).toBe(200);
    await expect(resource.json()).resolves.toMatchObject({
      resource: 'https://api.example.test/mcp',
      authorization_servers: ['https://api.example.test'],
      scopes_supported: [MCP_SCOPE],
    });

    const server = await realFetch(
      `${baseUrl}/.well-known/oauth-authorization-server`,
    );
    expect(server.status).toBe(200);
    await expect(server.json()).resolves.toMatchObject({
      issuer: 'https://api.example.test',
      registration_endpoint: 'https://api.example.test/oauth/register',
      token_endpoint_auth_methods_supported: ['none'],
      code_challenge_methods_supported: ['S256'],
    });
  });

  test('dynamically registers only HTTPS or loopback public clients', async () => {
    const client = await register();
    expect(client.client_id).toMatch(/^mcp_client_/);
    expect(client.redirect_uris).toEqual([
      'http://127.0.0.1:8787/callback',
    ]);

    const invalid = await realFetch(`${baseUrl}/oauth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ redirect_uris: ['http://evil.example/callback'] }),
    });
    expect(invalid.status).toBe(400);
    await expect(invalid.json()).resolves.toMatchObject({
      error: 'invalid_redirect_uri',
    });
  });

  test('supports legacy client IDs and clients that omit resource', async () => {
    const result = await authorizationCode({
      clientId: 'mcp_client_f6932245-1a0e-492c-a10a-1dc9263f805e',
      resource: null,
    });
    expect(result.code).toMatch(/^mcp_code_/);
  });

  test('rejects invalid resource, redirect URI, and PKCE', async () => {
    const client = await register();
    const verifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const base = {
      response_type: 'code',
      client_id: client.client_id,
      redirect_uri: 'http://127.0.0.1:8787/callback',
      scope: MCP_SCOPE,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state: 'state',
    };
    for (const override of [
      { resource: 'https://evil.example/mcp' },
      { redirect_uri: 'http://127.0.0.1:9999/callback' },
      { code_challenge_method: 'plain' },
    ]) {
      const response = await realFetch(
        `${baseUrl}/oauth/authorize?${new URLSearchParams({ ...base, ...override } as Record<string, string>)}`,
        { redirect: 'manual' },
      );
      expect(response.status).toBe(400);
    }
  });

  test('rejects tampered and expired encrypted OAuth state', async () => {
    const client = await register();
    const verifier = randomBytes(32).toString('base64url');
    const query = new URLSearchParams({
      response_type: 'code',
      client_id: client.client_id,
      redirect_uri: 'http://127.0.0.1:8787/callback',
      scope: MCP_SCOPE,
      code_challenge: createHash('sha256').update(verifier).digest('base64url'),
      code_challenge_method: 'S256',
      state: 'state',
    });
    const authorize = await realFetch(`${baseUrl}/oauth/authorize?${query}`, {
      redirect: 'manual',
    });
    const state = new URL(
      authorize.headers.get('location') ?? '',
    ).searchParams.get('state');
    expect(state).toBeTruthy();

    const tampered = await realFetch(
      `${baseUrl}/api/callback?code=value&state=${encodeURIComponent(`${state}x`)}`,
      { redirect: 'manual' },
    );
    expect(tampered.status).toBe(400);

    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now + 11 * 60_000);
    const expired = await realFetch(
      `${baseUrl}/api/callback?code=value&state=${encodeURIComponent(state ?? '')}`,
      { redirect: 'manual' },
    );
    expect(expired.status).toBe(400);
  });

  test('binds authorization codes to PKCE and consumes them once', async () => {
    const pending = await authorizationCode();
    const tampered = await redeem({ ...pending, code: `${pending.code}x` });
    expect(tampered.status).toBe(400);
    await expect(tampered.json()).resolves.toMatchObject({ error: 'invalid_grant' });

    const wrong = await redeem(pending, randomBytes(32).toString('base64url'));
    expect(wrong.status).toBe(400);
    await expect(wrong.json()).resolves.toMatchObject({ error: 'invalid_grant' });

    const valid = await redeem(pending);
    expect(valid.status).toBe(200);
    const token = (await valid.json()) as TokenResponse;
    expect(token.access_token).not.toContain('long-instagram-token');

    const replay = await redeem(pending);
    expect(replay.status).toBe(400);
    await expect(replay.json()).resolves.toMatchObject({ error: 'invalid_grant' });
  });

  test('challenges unauthenticated MCP requests and rejects hostile origins', async () => {
    const unauthenticated = await realFetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }),
    });
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.headers.get('www-authenticate')).toContain(
      'resource_metadata="https://api.example.test/.well-known/oauth-protected-resource/mcp"',
    );

    const invalidToken = await realFetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer mcp_access_tampered',
        accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }),
    });
    expect(invalidToken.status).toBe(401);
    expect(invalidToken.headers.get('www-authenticate')).toContain(
      'resource_metadata=',
    );

    const hostile = await realFetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        origin: 'https://evil.example',
        accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }),
    });
    expect(hostile.status).toBe(403);
  });

  test('initializes through the SDK and advertises exactly five typed tools', async () => {
    const token = await accessToken();
    const initialize = await mcp(token, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' },
      },
    });
    expect(initialize.status).toBe(200);
    await expect(initialize.json()).resolves.toMatchObject({
      jsonrpc: '2.0',
      id: 1,
      result: {
        capabilities: { tools: {} },
        serverInfo: { name: 'instasights', version: '3.0.0' },
      },
    });

    const listed = await mcp(token, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    });
    expect(listed.status).toBe(200);
    const payload = (await listed.json()) as {
      result: { tools: Array<{ name: string; inputSchema: Record<string, unknown> }> };
    };
    expect(payload.result.tools.map((tool) => tool.name)).toEqual([
      'instagram_get_profile',
      'instagram_get_account_insights',
      'instagram_list_media',
      'instagram_get_media',
      'instagram_get_media_insights',
    ]);
    expect(payload.result.tools[1].inputSchema).toMatchObject({
      additionalProperties: false,
      required: ['metrics'],
    });
  });

  test('dispatches all five tools through the MCP transport', async () => {
    const token = await accessToken();
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    ) as typeof fetch;
    const calls = [
      { name: 'instagram_get_profile', arguments: { fields: ['id'] } },
      {
        name: 'instagram_get_account_insights',
        arguments: { metrics: ['views'], period: 'day' },
      },
      { name: 'instagram_list_media', arguments: { fields: ['id'], limit: 1 } },
      { name: 'instagram_get_media', arguments: { mediaId: '456', fields: ['id'] } },
      {
        name: 'instagram_get_media_insights',
        arguments: { mediaId: '456', metrics: ['views'] },
      },
    ];
    for (const [index, tool] of calls.entries()) {
      const response = await mcp(token, {
        jsonrpc: '2.0',
        id: 10 + index,
        method: 'tools/call',
        params: tool,
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        id: 10 + index,
        result: { isError: false },
      });
    }
    expect(global.fetch).toHaveBeenCalledTimes(5);
  });

  test('calls Instagram live and strips token-bearing paging URLs', async () => {
    const token = await accessToken();
    global.fetch = jest.fn(async () =>
      new Response(
        JSON.stringify({
          data: [{ id: '1' }],
          paging: {
            cursors: { before: 'before', after: 'after' },
            next: 'https://graph.instagram.com/next?access_token=do-not-return',
          },
        }),
        { status: 200, headers: { 'x-app-usage': '{"call_count":1}' } },
      ),
    ) as typeof fetch;

    const response = await mcp(token, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'instagram_list_media',
        arguments: { fields: ['id', 'caption'], limit: 5 },
      },
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      result: { structuredContent: Record<string, unknown>; content: unknown[] };
    };
    expect(payload.result.structuredContent).toEqual({
      data: [{ id: '1' }],
      paging: { cursors: { before: 'before', after: 'after' } },
    });
    expect(JSON.stringify(payload)).not.toContain('do-not-return');

    const call = (global.fetch as jest.Mock).mock.calls[0] as [URL, RequestInit];
    expect(String(call[0])).toContain('/v25.0/123/media?');
    expect(String(call[0])).not.toContain('access_token');
    expect(call[1].headers).toEqual({
      authorization: 'Bearer long-instagram-token',
    });
  });
});
