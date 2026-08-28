---
name: Instasights
description: Connect a professional Instagram account and query live Instagram analytics from Claude Code.
---

Use the bundled `./instasights` CLI whenever the user asks about their Instagram analytics. Instasights reads the Instagram API live; there is no sync, database, report, or stored analytics layer.

## Workflow

1. Run `./instasights status`.
2. If `authenticated` is false, run `./instasights login` and let the user finish Instagram authorization in the browser.
3. Query only the data needed for the question.
4. Follow `paging.cursors.after` with `media list --after <cursor>` when more media is needed.
5. Analyze the returned JSON in the current Claude session.

## Commands

```bash
./instasights login
./instasights logout
./instasights status
./instasights account
./instasights insights --days 30
./instasights media list --days 30 --limit 25
./instasights media list --after <cursor>
./instasights media get <media-id>
./instasights media insights <media-id>
./instasights media insights <media-id> --metric views,reach,likes,saved,shares
```

## Rules

- Run commands from this skill directory, or resolve the launcher relative to `SKILL.md`.
- Node.js 20 or newer is required.
- stdout is JSON data; stderr is reserved for errors.
- Never read, print, summarize, or expose `.auth/state.json`.
- Never ask the user for an Instagram access token.
- Use current metrics such as `views`; do not request deprecated `impressions`.
- Some metrics vary by media type or may be unavailable. Treat missing data as unavailable, not zero.
