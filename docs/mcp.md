# Instagram Insights MCP

This document explains how LLM clients should connect to and use the hosted Instagram Insights MCP.

## What It Provides

The hosted MCP is exposed by the Next.js app at:

```text
https://YOUR_APP_DOMAIN/mcp
```

It supports two auth modes:

- Claude Code remote MCP via OAuth 2.0
- Personal developer API keys for REST, Codex, and non-OAuth clients

The MCP currently exposes tools for:

- Reading account overview
- Reading the latest normalized snapshot
- Listing and reading media
- Listing and reading sync runs
- Triggering a full sync when data is stale

## Authentication

### Claude Code OAuth

Claude Code can connect directly to the hosted MCP URL and complete OAuth in the browser:

```bash
claude mcp add --transport http instagram-insights https://YOUR_APP_DOMAIN/mcp
```

The hosted MCP advertises standard OAuth metadata and will redirect the user through the app's Google sign-in flow before issuing an MCP access token.

### Personal API Key

The MCP expects:

```http
Authorization: Bearer YOUR_API_KEY
```

Create the API key in the web app first. See [api-key-setup.md](./api-key-setup.md).

## Recommended Tool Flow

For most agent tasks, use this order:

1. `get_account_overview`
2. Inspect latest sync freshness
3. If stale, call `trigger_sync`
4. Poll with `get_sync_run`
5. Once complete, use `get_latest_snapshot`, `list_media`, and `get_media`

## Tool Notes

### `get_account_overview`

Use this first. It gives the linked account state and latest sync context for the authenticated user.

### `get_latest_snapshot`

Use this for normalized analysis-ready data. This is usually the best source for account-level reporting.

### `list_media`

Use this to inspect ingested media with pagination and optional filters.

### `get_media`

Use this when you need one media record, including stored insights and top comments when available.

### `list_sync_runs`

Use this to inspect sync history and decide whether data is stale.

### `get_sync_run`

Use this to poll a sync run after queueing it.

### `trigger_sync`

This queues a new full sync if needed.

Inputs:

- `force?: boolean`
- `staleAfterHours?: number`

Behavior:

- If a sync is already `queued` or `running`, it returns that run instead of queueing another one.
- If `force` is `false` and the latest completed sync is newer than `staleAfterHours`, it does not queue a new run.
- If `force` is `true`, it queues a new run even if the latest sync is recent.

## Example Prompts

```text
Use get_account_overview and tell me whether my data is fresh enough for analysis.
```

```text
If my latest completed sync is older than 12 hours, call trigger_sync and poll get_sync_run until it finishes.
```

```text
Use get_latest_snapshot and summarize my strongest recent content patterns.
```

## REST Equivalents

The MCP is backed by the same authenticated API surface under `/api/v1/*`.

Useful equivalents:

- `GET /api/v1/account`
- `GET /api/v1/media`
- `GET /api/v1/media/:mediaId`
- `GET /api/v1/sync-runs`
- `GET /api/v1/sync-runs/:syncRunId`
- `POST /api/v1/sync-runs`

The `POST /api/v1/sync-runs` endpoint is useful for non-MCP clients and matches the MCP `trigger_sync` behavior.
