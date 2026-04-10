---
name: Instagram Insights
description: Use the bundled Instagram Insights CLI to authenticate with Google, link Instagram, sync account data, and inspect account, snapshot, media, and sync-run data from the hosted REST API.
---

Use this skill whenever the user wants to work with Instagram Insights data.

Core rules:

- Use the bundled CLI, not raw HTTP requests and not MCP tools.
- Resolve paths relative to this skill folder.
- Start from `./instagram-insights.mjs` so the wrapper can install the latest CLI runtime into `./bin/` before running commands.
- The CLI stores OAuth tokens in `./.auth/state.json` inside this installed skill folder.
- Data-returning commands already default to JSON output.
- The installed skill bootstraps the latest CLI runtime from S3 when `./bin/` is missing, then the downloaded CLI keeps itself updated.

Preferred shortcut:

```bash
./instagram-insights.mjs
```

Invoke it from this skill folder. If you are in the repo root, use:

```bash
./skills/instagram-insights/instagram-insights.mjs
```

Generated direct bin entrypoint:

```bash
node ./bin/instagram-insights.mjs
```

That entrypoint appears after the wrapper has installed the runtime or after a local `yarn build:cli`.

Manual update commands:

```bash
./instagram-insights.mjs update check
./instagram-insights.mjs update apply
./instagram-insights.mjs update check --apply --force
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
- `INSTAGRAM_INSIGHTS_DISABLE_AUTO_UPDATE=1` disables the startup update check when you need to troubleshoot a bad rollout.
- If the skill is installed without a generated `./bin/` folder, set `INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL` so the wrapper can bootstrap the latest CLI from S3 on first run.
