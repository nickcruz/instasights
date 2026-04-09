---
description: Analyze Instagram account and media performance through the hosted MCP tools, using sync freshness before making recommendations.
disable-model-invocation: true
---

Use this skill for Instagram performance analysis, content pattern reviews, and media drilldowns.

Workflow:

1. Call `get_setup_status` first.
2. If the account is not linked, direct the user to `instagramLinkUrl`.
3. If there is no completed sync, or the user explicitly wants the latest data, call `/instagram-insights:sync` behavior through `trigger_sync` and `get_sync_run` before analyzing.
4. Use `get_latest_snapshot` for account-level analysis.
5. Use `list_media` for recent content lists and `get_media` for post-level drilldowns.
6. Use transcript fields only as opener or hook text for eligible video media, not as full-length transcripts.

Rules:

- Base conclusions on the hosted data, not assumptions.
- Be explicit when analysis is based on older-but-still-usable data.
- Prefer concise summaries with clear patterns, strongest posts, weak spots, and next experiments.
