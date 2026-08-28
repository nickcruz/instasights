#!/usr/bin/env node
import { createHash, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_API_URL = 'https://instasights.kingscrosslabs.com';
const root = process.env.INSTASIGHTS_SKILL_ROOT ?? process.cwd();
const stateFile = join(root, '.auth', 'state.json');
const apiUrl = (process.env.INSTASIGHTS_API_URL ?? DEFAULT_API_URL).replace(/\/$/, '');

async function readState() {
  try {
    const state = JSON.parse(await readFile(stateFile, 'utf8'));
    return state?.credential && state?.proof ? state : null;
  } catch {
    return null;
  }
}

async function writeState(state) {
  await mkdir(dirname(stateFile), { recursive: true, mode: 0o700 });
  await writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`, {
    mode: 0o600,
  });
  await chmod(stateFile, 0o600);
}

function openBrowser(url) {
  const command =
    process.platform === 'darwin'
      ? ['open', [url]]
      : process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '', url]]
        : ['xdg-open', [url]];
  const child = spawn(command[0], command[1], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve(server.address());
    });
  });
}

function waitForLogin(server, expectedState) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, credential) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      server.close();
      if (error) reject(error);
      else resolve(credential);
    };
    const timer = setTimeout(
      () => finish(new Error('Instagram login timed out after five minutes.')),
      5 * 60_000,
    );

    server.on('request', (request, response) => {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      if (request.method !== 'POST' || requestUrl.pathname !== '/callback') {
        response.writeHead(404).end('Not found');
        return;
      }

      let body = '';
      request.setEncoding('utf8');
      request.on('data', (chunk) => {
        body += chunk;
        if (body.length > 1024 * 1024) request.destroy();
      });
      request.on('end', () => {
        const form = new URLSearchParams(body);
        if (form.get('state') !== expectedState) {
          response.writeHead(400).end('Invalid login state.');
          finish(new Error('Instagram login state did not match.'));
          return;
        }
        const error = form.get('error');
        const credential = form.get('credential');
        if (error || !credential) {
          response.writeHead(400).end('Instagram login failed.');
          finish(new Error(error || 'Instagram login did not return a credential.'));
          return;
        }
        response
          .writeHead(200, { 'content-type': 'text/plain; charset=utf-8' })
          .end('Instagram connected. You may close this window.');
        finish(undefined, credential);
      });
      request.on('error', () => finish(new Error('Login callback failed.')));
    });
  });
}

export async function login({ launchBrowser = openBrowser } = {}) {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const clientState = randomBytes(32).toString('base64url');
  const server = createServer();
  const address = await listen(server);
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Unable to start the login callback.');
  }

  const redirectUri = `http://127.0.0.1:${address.port}/callback`;
  const authorizationUrl = new URL(`${apiUrl}/auth/instagram/start`);
  authorizationUrl.searchParams.set('redirect_uri', redirectUri);
  authorizationUrl.searchParams.set('state', clientState);
  authorizationUrl.searchParams.set('code_challenge', challenge);

  const callback = waitForLogin(server, clientState);
  launchBrowser(authorizationUrl.toString());
  const credential = await callback;
  await writeState({
    version: 1,
    credential,
    proof: verifier,
    apiUrl,
    authenticatedAt: new Date().toISOString(),
  });
  return { authenticated: true };
}

async function parseResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { error: { message: text || `HTTP ${response.status}` } };
  }
}

async function refresh(state) {
  const response = await fetch(`${apiUrl}/auth/instagram/refresh`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${state.credential}`,
      'x-instasights-proof': state.proof,
    },
  });
  const body = await parseResponse(response);
  if (!response.ok || !body?.credential) {
    throw new Error('Instagram authorization expired. Run: instasights login');
  }
  const updated = { ...state, credential: body.credential };
  await writeState(updated);
  return updated;
}

async function request(path, { retry = true } = {}) {
  const state = await readState();
  if (!state) throw new Error('Not logged in. Run: instasights login');
  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      authorization: `Bearer ${state.credential}`,
      'x-instasights-proof': state.proof,
    },
  });
  if (response.status === 401 && retry) {
    await refresh(state);
    return request(path, { retry: false });
  }
  const body = await parseResponse(response);
  if (!response.ok) {
    throw new Error(body?.error?.message ?? `Instasights request failed (${response.status})`);
  }
  return body;
}

export function parseOptions(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!key?.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);
    const value = args[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${key} requires a value`);
    options[key.slice(2)] = value;
    index += 1;
  }
  return options;
}

function assertOptions(options, allowed) {
  for (const key of Object.keys(options)) {
    if (!allowed.includes(key)) throw new Error(`Unsupported option: --${key}`);
  }
}

function unixRange(days) {
  const count = Number(days);
  if (!Number.isInteger(count) || count < 1 || count > 90) {
    throw new Error('--days must be an integer from 1 to 90');
  }
  const until = Math.floor(Date.now() / 1000);
  return { since: String(until - count * 86_400), until: String(until) };
}

function addOptions(params, options, names) {
  for (const name of names) {
    if (options[name]) params.set(name, options[name]);
  }
}

export function buildInsightsPath(args) {
  const options = parseOptions(args);
  assertOptions(options, [
    'metric',
    'period',
    'metric-type',
    'days',
    'since',
    'until',
    'breakdown',
  ]);
  const params = new URLSearchParams({
    metric:
      options.metric ??
      'views,reach,accounts_engaged,total_interactions',
    period: options.period ?? 'day',
    metric_type: options['metric-type'] ?? 'total_value',
  });
  if (options.days) {
    const range = unixRange(options.days);
    params.set('since', range.since);
    params.set('until', range.until);
  }
  addOptions(params, options, ['since', 'until', 'breakdown']);
  return `/v1/instagram/me/insights?${params}`;
}

export function buildMediaListPath(args) {
  const options = parseOptions(args);
  assertOptions(options, [
    'fields',
    'limit',
    'days',
    'since',
    'until',
    'after',
    'before',
  ]);
  const params = new URLSearchParams({
    fields:
      options.fields ??
      'id,caption,comments_count,like_count,media_product_type,media_type,permalink,timestamp,thumbnail_url',
    limit: options.limit ?? '25',
  });
  if (options.days) {
    const range = unixRange(options.days);
    params.set('since', range.since);
    params.set('until', range.until);
  }
  addOptions(params, options, ['since', 'until', 'after', 'before']);
  return `/v1/instagram/media?${params}`;
}

function requiredId(value) {
  if (!value || !/^\d+$/.test(value)) throw new Error('A numeric media ID is required');
  return value;
}

async function main() {
  const [command, subcommand, ...args] = process.argv.slice(2);
  let output;
  if (command === 'login') {
    output = await login();
  } else if (command === 'logout') {
    await rm(dirname(stateFile), { recursive: true, force: true });
    output = { authenticated: false };
  } else if (command === 'status') {
    output = { authenticated: Boolean(await readState()) };
  } else if (command === 'account') {
    output = await request(
      '/v1/instagram/me?fields=user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count',
    );
  } else if (command === 'insights') {
    output = await request(buildInsightsPath([subcommand, ...args].filter(Boolean)));
  } else if (command === 'media' && subcommand === 'list') {
    output = await request(buildMediaListPath(args));
  } else if (command === 'media' && subcommand === 'get') {
    output = await request(
      `/v1/instagram/media/${requiredId(args[0])}?fields=id,caption,comments_count,like_count,media_product_type,media_type,permalink,timestamp,thumbnail_url`,
    );
  } else if (command === 'media' && subcommand === 'insights') {
    const mediaId = requiredId(args[0]);
    const options = parseOptions(args.slice(1));
    assertOptions(options, ['metric']);
    const metrics =
      options.metric ?? 'views,reach,likes,comments,saved,shares,total_interactions';
    output = await request(
      `/v1/instagram/media/${mediaId}/insights?metric=${encodeURIComponent(metrics)}`,
    );
  } else {
    throw new Error(
      'Usage: instasights login | logout | status | account | insights [options] | media list|get|insights',
    );
  }
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
