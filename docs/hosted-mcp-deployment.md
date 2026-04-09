# Hosted MCP Deployment

This document covers how the hosted Instagram Insights backend is deployed and how that deployment now supports the Claude plugin-first user experience.

## Product shape

The hosted web app continues to provide the backend and orchestration layer for:

- `/mcp`
- `/.well-known/oauth-*`
- `/oauth/*`
- `/api/login`
- `/api/callback`
- `/api/v1/*`
- the workflow-backed sync job
- the Whisper transcriber service

The product UI is intentionally minimal. `/developers` is the supported human-facing page for install guidance and troubleshooting. `/auth/complete` is the thin Instagram callback completion surface. Legacy `/`, `/profile`, and `/profile/developer` routes redirect into the new flow.

## Primary user install flow

The primary install flow is now Claude plugin installation:

```text
/plugin marketplace add https://github.com/nickcruz/instagram-insights.git
/plugin install instagram-insights@instagram-insights-plugins
```

Inside the plugin bundle:

- `.claude-plugin/marketplace.json` defines the repository marketplace
- `plugins/instagram-insights/.plugin/plugin.json` defines the Claude plugin
- `plugins/instagram-insights/.mcp.json` bundles the hosted remote MCP server
- `plugins/instagram-insights/skills/*` provides Claude-visible setup, connect, sync, and analysis skills

Google auth is handled by Claude’s MCP OAuth flow. Instagram linking stays a thin hosted browser handoff through `/api/login` and `/api/callback`.

## Backend behavior that stays the same

The migration does not replace the backend contracts.

- Existing `/api/v1/*` routes remain available
- Existing `/mcp` tools remain available
- Vercel Workflow remains the orchestration layer for sync jobs
- The Whisper service remains the transcription backend
- Developer API keys remain supported as a compatibility path

## Authentication model

The backend now supports shared bearer auth for both MCP and REST:

- OAuth access tokens issued through the hosted MCP OAuth flow
- Developer API keys issued on `/developers`

Both are accepted as:

```http
Authorization: Bearer YOUR_TOKEN
```

This means:

- Claude plugin users authenticate through OAuth
- REST clients can use either OAuth bearer tokens or legacy API keys
- MCP `trigger_sync` and REST `POST /api/v1/sync-runs` share the same queueing behavior

## Required environment variables

At minimum, production needs:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID` or `GOOGLE_CLIENT_ID`
- `AUTH_GOOGLE_SECRET` or `GOOGLE_CLIENT_SECRET`
- `INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`
- `INSTAGRAM_APP_URL`

Recommended:

- `APP_URL`
- `INSTAGRAM_REDIRECT_URI`
- `GRAPH_API_VERSION`

Notes:

- `APP_URL` should be the canonical public origin shown on `/developers`
- `INSTAGRAM_APP_URL` should match the public deployed origin unless Instagram auth is intentionally split out
- `INSTAGRAM_REDIRECT_URI` should match the deployed callback route exactly

## Database rollout

Before the deployment is treated as production-ready:

1. Apply the latest Drizzle migrations
2. Confirm the API key tables exist and are readable
3. Confirm the existing Instagram sync tables still read and write correctly

## Deployment checklist

1. Push the current branch and deploy the web app to Vercel
2. Confirm these routes return successfully on the deployed domain:
   - `/developers`
   - `/auth/complete`
   - `/api/v1/account`
   - `/api/v1/sync-runs`
   - `/mcp`
3. Confirm the OAuth metadata endpoints are live:
   - `/.well-known/oauth-authorization-server`
   - `/.well-known/oauth-protected-resource`
4. Sign in with a real user through `/developers`
5. Link Instagram through `/api/login`
6. Trigger a sync and confirm the workflow-backed run completes
7. Install the Claude plugin from the repository marketplace
8. Confirm `/instagram-insights:setup` guides the user correctly

## Acceptance criteria

The hosted deployment is ready when all of these are true:

- `/developers` renders the Claude-first install instructions
- `/auth/complete` handles Instagram callback success and failure states
- Claude can authenticate the hosted MCP through OAuth
- `get_setup_status` returns the correct next action for a newly signed-in user
- `trigger_sync` and `POST /api/v1/sync-runs` behave the same for active-run reuse and freshness checks
- OAuth bearer tokens work on `/api/v1/account`, `/api/v1/media`, and `/api/v1/sync-runs`
- Legacy developer API keys still work for those same REST routes
- Workflow-backed sync and the Whisper transcriber continue working without contract changes

## Local plugin development

The bundled `.mcp.json` points directly at the production hosted MCP server:

- `https://project-qah0p.vercel.app/mcp`

For local plugin development:

```bash
claude --plugin-dir ./plugins/instagram-insights
```

This keeps the plugin install path aligned with the hosted production backend without inventing a second local token store.
