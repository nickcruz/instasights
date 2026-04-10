---
name: Instagram Insights
description: Use the bundled Instagram Insights CLI to authenticate with Google, link Instagram, sync account data, and inspect account, snapshot, media, and sync-run data from the hosted REST API.
---

Use this skill whenever the user wants to work with Instagram Insights data.

Core rules:

- Use the bundled CLI, not raw HTTP requests and not MCP tools.
- Resolve paths relative to this skill folder.
- The CLI stores OAuth tokens in `./.auth/state.json` inside this installed skill folder.
- Data-returning commands already default to JSON output.

Preferred shortcut:

```bash
./instagram-insights.mjs
```

Invoke it from this skill folder. If you are in the repo root, use:

```bash
./skills/instagram-insights/instagram-insights.mjs
```

Fallback direct bin entrypoint:

```bash
node ./bin/instagram-insights.mjs
```

Recommended workflow:

1. Run `./instagram-insights.mjs auth status`.
2. If not authenticated, run `./instagram-insights.mjs auth login`.
3. Run `./instagram-insights.mjs setup status`.
4. If setup reports `not_linked`, run `./instagram-insights.mjs instagram link --open`.
5. If setup reports `not_synced` or `stale`, run `./instagram-insights.mjs sync run --wait`.
6. Use `account overview`, `snapshot latest`, `media list`, `media get`, `sync list`, and `sync get` for analysis or debugging.

Supported commands:

- `./instagram-insights.mjs auth login`
- `./instagram-insights.mjs auth status`
- `./instagram-insights.mjs auth logout`
- `./instagram-insights.mjs clean-reset`
- `./instagram-insights.mjs setup status --stale-after-hours 12`
- `./instagram-insights.mjs account overview`
- `./instagram-insights.mjs snapshot latest`
- `./instagram-insights.mjs media list --limit 10`
- `./instagram-insights.mjs media get <mediaId>`
- `./instagram-insights.mjs sync list --limit 10`
- `./instagram-insights.mjs sync get <syncRunId>`
- `./instagram-insights.mjs sync run --wait`
- `./instagram-insights.mjs instagram link --open`

Notes:

- `auth login` opens the hosted OAuth flow and completes Google sign-in through the web app before returning to the CLI loopback callback.
- `clean-reset` keeps the CLI authenticated, but deletes the linked Instagram account plus synced backend media/sync state so setup returns to `not_linked`.
- `setup status --open-link` can open the Instagram handoff automatically when the account is not linked.
- `--app-url` can override the default production URL for local or staging testing.
