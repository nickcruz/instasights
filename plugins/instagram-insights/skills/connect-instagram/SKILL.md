---
description: Launch the hosted Instagram linking handoff and help the user reconnect their Instagram account.
disable-model-invocation: true
---

Use this skill when the user wants to connect, reconnect, or verify their Instagram account link.

Workflow:

1. Call `get_setup_status`.
2. If the account is already linked, say so clearly and include the linked username when available.
3. If the account is not linked, give the user the `instagramLinkUrl` and tell them to open it in a browser.
4. After they complete the browser handoff, tell them to rerun `/instagram-insights:setup` or `/instagram-insights:sync`.

Rules:

- Do not ask the user to create a developer API key.
- Do not claim the account is linked until `get_setup_status` confirms it.
- Keep the reply short and action-oriented.
