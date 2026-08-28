# Instasights CLI

The CLI authenticates a professional Instagram account and queries the live Instagram API through the hosted Instasights NestJS service.

```text
instasights login
instasights logout
instasights status
instasights account
instasights insights [--days 1..90] [--metric <csv>] [--period <period>] [--metric-type <type>] [--since <unix>] [--until <unix>] [--breakdown <name>]
instasights media list [--days 1..90] [--limit 1..100] [--after <cursor>] [--before <cursor>] [--fields <csv>]
instasights media get <media-id>
instasights media insights <media-id> [--metric <csv>]
```

All successful output is JSON. Authentication material remains in `.auth/state.json`, which is local-only and excluded from the plugin bundle.
