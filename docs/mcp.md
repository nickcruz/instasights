# MCP Deprecation

The hosted Instagram Insights MCP has been deprecated.

## Deprecated endpoints

- `/mcp`
- `/.well-known/oauth-protected-resource/mcp`

Both now return `410 Gone`.

## Supported replacement

Use the Instagram Insights skill and bundled CLI instead:

```bash
./skills/instagram-insights/instagram-insights.mjs auth login
./skills/instagram-insights/instagram-insights.mjs setup status
./skills/instagram-insights/instagram-insights.mjs sync run --wait
```

The CLI talks directly to `/api/v1/*` and authenticates through `/oauth/*`.

On a fresh install, start from `./skills/instagram-insights/instagram-insights.mjs` so the skill can bootstrap the generated CLI into `./bin/` before running commands.
