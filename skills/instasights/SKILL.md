---
name: Instasights
description: Use the bundled Node-based Instasights CLI to authenticate with Google, link Instagram, sync account data, and inspect account, snapshot, media, sync-run data, and HTML reports from the hosted REST API.
---

Use this skill whenever the user wants to work with Instasights data.

### Quickstart

1. Run `./instasights auth status`.
2. If not authenticated, run `./instasights auth login`.
3. Run `./instasights setup status`.
4. If setup reports `not_linked`, run `./instasights instagram link --open`.
5. If setup reports `not_synced` or `stale`, run `./instasights sync run --wait`.
6. Use `./instasights media analyze --days 30` for the precomputed 30-day JSON report.
7. Use `./instasights report generate --days 30` when you want a self-contained HTML dashboard export.
8. Use `account overview`, `snapshot latest`, `media list`, `media get`, `sync list`, and `sync get` for debugging.

### Core Rules

- Use the bundled CLI, not raw HTTP requests and not MCP tools.
- Target: Node.js 20 or newer.
- Resolve paths relative to this skill folder.
- Start from `./instasights` so the launcher can verify Node and run the bundled MJS runtime from `./bin/`.
- The CLI stores OAuth tokens in `./.auth/state.json` inside this installed skill folder.
- Runtime-only skill state lives under `./.auth/` and `./.cache/`, and `./.skillignore` excludes those paths from SkillTree sync and publish.
- Data-returning commands already default to JSON output.
- Networked commands also emit structured JSON runtime logs on stderr so observers can track phases, waits, and progress while stdout stays reserved for the final payload.
- The installed skill ships with committed MJS runtime files in `./bin/`, and the updater keeps those files refreshed over time.

Preferred shortcut:

```bash
./instasights
```

Invoke it from this skill folder. If you are in the repo root, use:

```bash
./skills/instasights/instasights
```

Generated direct bin entrypoint:

```bash
node ./bin/instasights.mjs
```

That entrypoint is committed with the skill and refreshed by `yarn build:cli` during development.

Manual update commands

```bash
./instasights update check
./instasights update apply
./instasights update check --apply --force
```

### Reference: Supported commands

- `./instasights auth login`
- `./instasights auth status`
- `./instasights auth logout`
- `./instasights clean-reset`
- `./instasights setup status --stale-after-hours 12`
- `./instasights account overview`
- `./instasights snapshot latest`
- `./instasights media list --limit 10 --days 30 --flat-metrics`
- `./instasights media get <mediaId>`
- `./instasights media analyze --days 30`
- `./instasights media analyze --days 30 --paginate 1 --page-size 5`
- `./instasights report generate --days 30`
- `./instasights sync list --limit 10`
- `./instasights sync get <syncRunId>`
- `./instasights sync run --wait`
- `./instasights instagram link --open`

For a deeper command-by-command reference, see [CLI.md](/Users/nickcruz/repos/instasights/skills/instasights/CLI.md).

Notes:

- `auth login` opens the hosted OAuth flow and completes Google sign-in through the web app before returning to the CLI loopback callback.
- Long-running commands such as `sync run --wait` emit JSON log events on stderr for queue/reuse decisions, timing estimates, progress changes, and heartbeat updates.
- `clean-reset` keeps the CLI authenticated, but deletes the linked Instagram account plus synced backend media/sync state so setup returns to `not_linked`.
- `setup status --open-link` can open the Instagram handoff automatically when the account is not linked.
- `report generate --days 30` writes a static HTML dashboard using stored report data and deterministic CLI-side heuristics. It does not require any extra model API call.
- `--app-url` can override the default production URL for local or staging testing.
- `INSTASIGHTS_DISABLE_AUTO_UPDATE=1` disables the startup update check when you need to troubleshoot a bad rollout.
- `INSTASIGHTS_UPDATE_MANIFEST_URL` can override the hosted manifest URL when you need to test a staging build.
