# Instagram Insights MCP

This document explains how the hosted Instagram Insights MCP is packaged for Claude and how it maps to the existing backend.

## Claude-first install flow

The primary user experience is the Claude plugin, not a custom dashboard or manual MCP wiring.

Install from the repository marketplace:

```text
/plugin marketplace add https://github.com/nickcruz/instagram-insights.git
/plugin install instagram-insights@instagram-insights-plugins
```

The plugin bundles one remote HTTP MCP server that points at:

```text
https://YOUR_APP_DOMAIN/mcp
```

During install, Claude authenticates that MCP server with the hosted OAuth flow. Google sign-in happens there; the plugin does not store its own tokens.

For local development before the production app URL is finalized, set:

```bash
export INSTAGRAM_INSIGHTS_APP_URL="https://YOUR_APP_DOMAIN"
```

Then load the local plugin bundle:

```bash
claude --plugin-dir ./plugins/instagram-insights
```

## What the hosted MCP provides

The hosted MCP is exposed by the Next.js app at `/mcp` and keeps the existing backend contract intact.

It provides tools for:

- `get_setup_status`
- `get_account_overview`
- `get_latest_snapshot`
- `list_media`
- `get_media`
- `list_sync_runs`
- `get_sync_run`
- `trigger_sync`

It also continues to expose the schema resources already backed by the web app.

## Authentication

### Primary path: Claude OAuth

Claude should authenticate to the hosted MCP with OAuth. The server supports standard OAuth metadata under:

- `/.well-known/oauth-authorization-server`
- `/.well-known/oauth-protected-resource`
- `/oauth/*`

Claude stores the MCP access token locally. The plugin should not write custom secret files or plugin-managed token caches.

### Compatibility path: developer API keys

The backend still supports personal developer API keys for advanced users and non-OAuth clients.

Send either an OAuth access token or a developer API key as:

```http
Authorization: Bearer YOUR_TOKEN
```

Developer API keys are now a fallback path, not the recommended Claude install flow. See [api-key-setup.md](./api-key-setup.md).

## Recommended tool flow

For Claude plugin skills and general agent usage, use this order:

1. `get_setup_status`
2. Follow `recommendedNextAction`
3. If sync is required, call `trigger_sync`
4. Poll with `get_sync_run` until terminal
5. Use `get_latest_snapshot`, `list_media`, and `get_media` for analysis

## Tool notes

### `get_setup_status`

Use this first for plugin orchestration. It returns:

- whether the user has linked Instagram
- the latest sync state
- freshness guidance
- `instagramLinkUrl`
- `developersUrl`
- the recommended next action and prompt

This is the best entrypoint for setup, connect, and sync skills.

### `get_account_overview`

Use this when you need the normalized account summary without the extra setup guidance.

### `get_latest_snapshot`

Use this for analysis-ready account reporting. This is usually the best source for account-level summaries and recent performance analysis.

### `list_media`

Use this to inspect ingested media with pagination and optional filters.

### `get_media`

Use this when you need a single media record, including stored insights, comments when available, and any saved transcript snippet.

Transcript note:

- `transcriptText` is the opening portion of audio for eligible video media, not a full transcription of the entire asset.
- It is best used for hook analysis, opener comparisons, and quick topical inspection.

### `list_sync_runs`

Use this to inspect sync history directly.

### `get_sync_run`

Use this to poll a queued or running sync.

### `trigger_sync`

This queues a full sync through the same shared service used by `POST /api/v1/sync-runs`.

Inputs:

- `force?: boolean`
- `staleAfterHours?: number`

Behavior:

- Reuses the active sync run if one is already `queued` or `running`
- Skips queueing when the latest completed sync is still fresh and `force` is `false`
- Queues a new workflow-backed sync when the data is stale or `force` is `true`

## REST equivalents

The MCP is backed by the same authenticated API surface under `/api/v1/*`.

Useful equivalents:

- `GET /api/v1/account`
- `GET /api/v1/media`
- `GET /api/v1/media/:mediaId`
- `GET /api/v1/sync-runs`
- `GET /api/v1/sync-runs/:syncRunId`
- `POST /api/v1/sync-runs`

These routes now accept either:

- an MCP OAuth bearer token
- a legacy developer API key

`POST /api/v1/sync-runs` and MCP `trigger_sync` now share the same queueing behavior.

## Example prompts

```text
Use get_setup_status and tell me what I still need before analysis is ready.
```

```text
If my latest completed sync is older than 12 hours, call trigger_sync and poll get_sync_run until it finishes.
```

```text
Use get_latest_snapshot and summarize my strongest recent content patterns.
```
