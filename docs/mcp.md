# MCP Deprecation

The hosted Instagram Insights MCP has been deprecated.

## Deprecated endpoints

- `/mcp`
- `/.well-known/oauth-protected-resource/mcp`

Both now return `410 Gone`.

## Supported replacement

Use the Instagram Insights skill and bundled CLI instead:

```bash
./skills/instagram-insights/instagram-insights auth login
./skills/instagram-insights/instagram-insights setup status
./skills/instagram-insights/instagram-insights sync run --wait
```

The CLI talks directly to `/api/v1/*` and authenticates through `/oauth/*`.

On a fresh install, start from `./skills/instagram-insights/instagram-insights` so the skill can verify Node.js 20+ and run the bundled MJS CLI from `./bin/`.
