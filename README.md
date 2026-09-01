# Instasights MCP

Instasights is a thin remote MCP server for live Instagram professional-account analytics. Users complete Instagram Login once, then Claude sees five typed, read-only tools. Instasights does not sync, aggregate, report, transcribe, or store analytics.

## Install in Claude

Run these commands in Claude Code, including Claude Code inside the Claude Desktop app:

```text
/plugin marketplace add https://github.com/kingscrosslabs/marketplace.git
/plugin install instasights@kingscrosslabs-marketplace
```

Then ask Claude:

> Connect my Instagram account and analyze the last 30 days.

Claude performs standard MCP OAuth, opens Instagram authorization in the browser, and stores only the opaque MCP credential in its credential storage. No Node.js runtime, CLI, skill executable, API key, or manually copied Instagram token is required.

## Tools

- `instagram_get_profile`
- `instagram_get_account_insights`
- `instagram_list_media`
- `instagram_get_media`
- `instagram_get_media_insights`

Tool schemas expose the supported fields, metrics, time ranges, and cursor pagination inputs. Every call reads Instagram live.

## Architecture

The production MCP endpoint is:

```text
https://instasights.kingscrosslabs.com/mcp
```

The server implements stateless Streamable HTTP MCP and OAuth discovery, dynamic client registration, authorization code with S256 PKCE, and protected-resource bearer challenges. The Instagram long-lived token is carried only inside an AES-256-GCM encrypted, audience-bound MCP credential. The API has no database or analytics state.

Authorization-code nonces have a bounded process-local replay cache. PKCE, exact redirect validation, audience binding, and short code expiry remain effective across instances; strict cross-instance one-time code consumption would require shared state and is intentionally outside this database-free design.

The public HTTP surface is limited to:

```text
GET  /health
GET  /.well-known/oauth-protected-resource/mcp
GET  /.well-known/oauth-authorization-server
POST /oauth/register
GET  /oauth/authorize
POST /oauth/token
GET  /api/callback
POST /mcp
```

The Graph wrapper accepts only allowlisted profile, insight, media, and media-insight operations. It strips token-bearing paging URLs and returns cursor values only.

## Development

Copy `.env.example`, configure the required variables, and run:

```bash
yarn install
yarn dev
```

The Meta redirect URI is:

```text
https://YOUR_DOMAIN/api/callback
```

## Validation

```bash
yarn typecheck
yarn lint
yarn test
yarn build
docker build -f Dockerfile.vercel -t instasights .
claude plugin validate .
```

See [`docs/instagram-api-contract.md`](docs/instagram-api-contract.md) for supported Instagram scopes, fields, metrics, and access limitations.
