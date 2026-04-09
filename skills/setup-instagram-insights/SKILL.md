---
name: setup
description: Check setup state, connect Instagram if needed, trigger syncs when stale, and hand off to analysis when the account is ready.
disable-model-invocation: true
---

Use the hosted Instagram Insights MCP as the source of truth.

Workflow:

1. Call `get_setup_status` with `staleAfterHours: 12` unless the user requests a different freshness window.
2. If `status` is `not_linked`, tell the user to open `instagramLinkUrl` in their browser, complete the Instagram OAuth handoff, and then rerun `/instagram-insights:setup`.
3. If `status` is `syncing`, poll `get_sync_run` for the current run until it completes or fails.
4. If `status` is `not_synced` or `stale`, call `trigger_sync` with `force: false` and the chosen `staleAfterHours`, then poll `get_sync_run` until the run reaches a terminal state.
5. If `status` is `ready`, summarize the linked account, latest sync freshness, and suggest `/instagram-insights:analyze` for deeper analysis.

Important behavior:

- Claude starts the hosted MCP OAuth flow, then Instagram Insights finishes the first-party Google sign-in step on the app root before returning the user to Claude. Do not tell the user to create API keys as part of the primary setup path.
- When you provide `instagramLinkUrl`, explain that it uses the same browser session created during the app-root sign-in handoff from Claude.
- If a sync fails, report the error message and current step from `get_sync_run` without inventing fallback analysis.
