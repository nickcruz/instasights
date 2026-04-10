---
name: Instagram Insights
description: Use the bundled macOS Instagram Insights CLI to authenticate with Google, link Instagram, sync account data, and inspect account, snapshot, media, and sync-run data from the hosted REST API.
---

Use this skill whenever the user wants to work with Instagram Insights data.

For a deeper command-by-command reference, see [CLI.md](/Users/nickcruz/repos/instagram-insights/skills/instagram-insights/CLI.md).

Core rules:

- Use the bundled CLI, not raw HTTP requests and not MCP tools.
- Target: macOS on Apple Silicon.
- Resolve paths relative to this skill folder.
- Start from `./instagram-insights` so the launcher can install the latest signed CLI binaries into `./bin/` before running commands.
- The CLI stores OAuth tokens in `./.auth/state.json` inside this installed skill folder.
- Runtime-only skill state lives under `./.auth/`, `./.cache/`, and `./bin/`, and `./.skillignore` excludes those paths from SkillTree sync and publish.
- Data-returning commands already default to JSON output.
- The installed skill bootstraps the latest signed CLI binaries when `./bin/` is missing, then the downloaded CLI keeps itself updated.

Preferred shortcut:

```bash
./instagram-insights
```

Invoke it from this skill folder. If you are in the repo root, use:

```bash
./skills/instagram-insights/instagram-insights
```

Generated direct bin entrypoint:

```bash
./bin/instagram-insights
```

That entrypoint appears after the launcher has installed the runtime or after a local `yarn package:cli:macos`.

Manual update commands:

```bash
./instagram-insights update check
./instagram-insights update apply
./instagram-insights update check --apply --force
```

Recommended workflow:

1. Run `./instagram-insights auth status`.
2. If not authenticated, run `./instagram-insights auth login`.
3. Run `./instagram-insights setup status`.
4. If setup reports `not_linked`, run `./instagram-insights instagram link --open`.
5. If setup reports `not_synced` or `stale`, run `./instagram-insights sync run --wait`.
6. Use `./instagram-insights media analyze --days 30` for the precomputed 30-day report, plus `account overview`, `snapshot latest`, `media list`, `media get`, `sync list`, and `sync get` for debugging.

Supported commands:

- `./instagram-insights auth login`
- `./instagram-insights auth status`
- `./instagram-insights auth logout`
- `./instagram-insights clean-reset`
- `./instagram-insights setup status --stale-after-hours 12`
- `./instagram-insights account overview`
- `./instagram-insights snapshot latest`
- `./instagram-insights media list --limit 10 --days 30 --flat-metrics`
- `./instagram-insights media get <mediaId>`
- `./instagram-insights media analyze --days 30`
- `./instagram-insights sync list --limit 10`
- `./instagram-insights sync get <syncRunId>`
- `./instagram-insights sync run --wait`
- `./instagram-insights instagram link --open`

Notes:

- `auth login` opens the hosted OAuth flow and completes Google sign-in through the web app before returning to the CLI loopback callback.
- `clean-reset` keeps the CLI authenticated, but deletes the linked Instagram account plus synced backend media/sync state so setup returns to `not_linked`.
- `setup status --open-link` can open the Instagram handoff automatically when the account is not linked.
- `--app-url` can override the default production URL for local or staging testing.
- `INSTAGRAM_INSIGHTS_DISABLE_AUTO_UPDATE=1` disables the startup update check when you need to troubleshoot a bad rollout.
- `INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL` can override the hosted manifest URL when you need to test a staging build.
