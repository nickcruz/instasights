# MCP-Only Instasights Migration

## Context

Instasights currently ships a Claude skill plus bundled Node CLI. The CLI opens Instagram OAuth, stores an encrypted proof-bound credential under the installed skill, and calls allowlisted REST analytics routes. The desired end state is a thin remote MCP server: users install the plugin, complete a quick Instagram login through standard MCP OAuth, and see typed Instagram analytics tools directly in Claude. No sync, reports, database, arbitrary Graph proxy, or server-side analytics state should be introduced.

The current production domain is `https://instasights.kingscrosslabs.com`; Meta already uses `https://instasights.kingscrosslabs.com/api/callback`.

## Approach

- Replace the skill/CLI transport with a remote Streamable HTTP MCP endpoint at `/mcp`.
- Implement the MCP authorization profile around OAuth 2.1 discovery, dynamic client registration, authorization code + S256 PKCE, protected-resource metadata, and bearer authentication.
- Keep the backend stateless by placing the Instagram long-lived token inside an AES-256-GCM encrypted, audience-bound MCP bearer credential stored by the MCP client. The raw Instagram token must never appear in URLs, logs, MCP tool output, or plugin files.
- Expose only five typed, read-only MCP tools corresponding to the existing allowlisted live operations: profile, account insights, media list, media item, and media insights.
- Reuse the existing Instagram Graph request validation, field/metric allowlists, response sanitization, cursor handling, timeout handling, and rate-limit propagation.
- Remove the public analytics REST surface and all CLI/skill packaging. Retain only `/health`, MCP/OAuth discovery and exchange routes, the Instagram callback, and `/mcp`.
- Update both plugin marketplaces to install an MCP-only plugin whose `.mcp.json` points to the production `/mcp` endpoint.

## Files to modify

- Backend composition and routes: `src/app.module.ts`, `src/main.ts`, `src/auth/*`, `src/instagram/*`, new `src/mcp/*`
- Plugin packaging: `.mcp.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`
- Remove CLI/skill packaging: `packages/cli/**`, `skills/instasights/**`
- Build metadata: `package.json`, `yarn.lock`, `.gitignore`, `.dockerignore`
- Documentation: `README.md`, `docs/claude-plugin-setup.md`, `docs/instagram-api-contract.md`, `PLAN.md`
- Tests: `test/auth.test.ts`, `test/http.integration.test.ts`, `test/instagram.service.test.ts`, new MCP protocol/tool tests; remove `packages/cli/test/**`
- External marketplace after the main plugin release: `../kingscrosslabs-marketplace/.claude-plugin/marketplace.json`, `../kingscrosslabs-marketplace/README.md`

## Reuse

- `src/auth/auth.service.ts`: Instagram short-token exchange, long-lived-token exchange, profile lookup, AES-256-GCM primitives, and secret-safe upstream error handling.
- `src/config/environment.ts`: strict environment loading and encryption key handling.
- `src/instagram/instagram.service.ts`: field/metric allowlists, query validation, Graph API bearer calls, paging URL stripping, safe errors, timeouts, and rate-limit headers.
- `src/health/health.controller.ts`: deployment health contract.
- `docs/instagram-api-contract.md`: current Instagram scopes, metrics, and access limitations.

## Steps

- [x] Finalize the stateless MCP bearer lifetime/revocation decision.
- [x] Add the maintained MCP TypeScript SDK and build a stateless Streamable HTTP transport at `POST /mcp`; return protocol-appropriate responses for unsupported GET/DELETE streaming operations.
- [x] Add OAuth protected-resource and authorization-server metadata, dynamic client registration, `/oauth/authorize`, `/oauth/token`, and the existing `/api/callback` Instagram handoff.
- [x] Bind authorization codes to registered redirect URI, client ID, MCP resource, scope, and S256 PKCE verifier; encrypt all state, codes, and access credentials.
- [x] Require `Authorization: Bearer` on every MCP request and emit the standard `WWW-Authenticate` protected-resource challenge on `401`.
- [x] Refactor the Instagram service from Express-response writing to reusable typed return values without weakening current allowlists or sanitization.
- [x] Register five read-only tools with explicit schemas, defaults, descriptions, allowed fields/metrics, and cursor pagination inputs.
- [x] Remove the REST analytics controllers, CLI-specific OAuth routes/proof guard, CLI package, bundled runtime, skill instructions, build script, tests, and local `.auth` conventions.
- [x] Replace skill metadata with `.mcp.json`; bump plugin/catalog version and validate a fresh isolated install from both marketplaces.
- [x] Rewrite user and operator documentation around MCP tool discovery and browser-based Instagram login.
- [x] Add unit, HTTP integration, MCP initialize/tools-list/tools-call, OAuth discovery/DCR/PKCE, token secrecy, and Graph passthrough tests.
- [x] Deploy to Vercel, verify OAuth with a fresh client, verify live tool discovery and profile access, then update and push the King's Cross marketplace.

## Verification

- `yarn typecheck`, `yarn lint`, `yarn test`, `yarn build`, and Docker build all pass.
- MCP unauthenticated request returns `401` with valid protected-resource metadata discovery.
- OAuth DCR + authorization code + S256 PKCE succeeds; invalid redirect, resource, scope, verifier, expired code, and tampered ciphertext fail safely.
- `initialize`, `tools/list`, and all five `tools/call` paths work through a standard MCP client.
- Tool results preserve live Instagram data and cursor values but never return paging URLs or credentials.
- Repository and rendered logs contain no Instagram token, MCP access token, OAuth code, or local auth state.
- Fresh Claude Code/Desktop install shows only MCP tools, triggers Instagram login, and does not install or execute a CLI/skill.
- `https://instasights.kingscrosslabs.com/health` remains healthy after cutover.

## Decision needed

A database-free MCP bearer cannot be immediately revoked because the server has no session record. The recommended thin design encrypts the Instagram token into an opaque, audience-bound MCP access token and expires it no later than the Instagram token. Logout means deleting the credential in Claude; emergency revocation relies on Instagram or encryption-key rotation.
