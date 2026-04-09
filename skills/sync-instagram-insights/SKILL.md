---
name: sync
description: Trigger a hosted Instagram sync through MCP, reuse recent or active runs when possible, and report the final run status.
disable-model-invocation: true
---

Use this skill when the user asks to sync, refresh, or fetch the latest Instagram data.

Workflow:

1. Call `get_setup_status` with `staleAfterHours: 12` by default.
2. If the account is not linked, send the user to `instagramLinkUrl`, mention that it reuses the browser session created during the root handoff from Claude, and stop.
3. If the user explicitly says `force`, call `trigger_sync` with `force: true`.
4. Otherwise call `trigger_sync` with `force: false` and `staleAfterHours: 12`, or the freshness window the user requested.
5. If `trigger_sync` returns an existing run or a recent fresh run, explain that reuse clearly.
6. If a run is queued or running, poll `get_sync_run` until it reaches `completed` or `failed`.
7. Summarize `status`, `mediaCount`, `warningCount`, and any reported error.

Rules:

- Prefer smart queueing over forcing new runs.
- Do not tell the user to click a dashboard button.
- If the run fails, report the stored failure details and stop.
