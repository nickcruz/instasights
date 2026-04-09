# Claude Plugin Setup

This is the primary install path for Instagram Insights.

## Install from the repository marketplace

Add the repository as a Claude plugin marketplace:

```text
/plugin marketplace add https://github.com/kingscrosslabs/marketplace.git
```

Install the plugin:

```text
/plugin install instagram-insights@kingscrosslabs-marketplace
```

## What happens during install

The plugin bundles the hosted MCP server at `/mcp`.

Claude will:

1. Load the plugin bundle
2. Start the hosted MCP OAuth consent flow
3. Redirect to the app root so the user can sign in to Instagram Insights with Google
4. Resume the original OAuth request back into Claude
5. Store the OAuth credentials locally
6. Expose Claude-visible skills for setup, Instagram linking, sync, and analysis

The plugin does not manage its own token files or local secret storage.

## First run

After install, start with:

```text
/instagram-insights:setup
```

That skill will:

- Check whether you have linked Instagram
- Look at your latest sync status
- Tell you whether to connect, sync, wait, or analyze

## Local plugin development

If you are testing the plugin bundle directly from the repo:

```bash
claude --plugin-dir ./plugins/instagram-insights
```

Then reload plugins and run:

```text
/instagram-insights:setup
```

## Troubleshooting

### I need to re-authenticate Google

Claude owns the MCP OAuth session, but Instagram Insights still uses a first-party Google login on the app root. Re-run the connector auth flow rather than creating a manual Google-auth skill.

### I still need to link Instagram

Use:

```text
/instagram-insights:connect
```

That skill will open the hosted `/api/login` handoff and then have Claude re-check setup status.
That Instagram browser handoff reuses the same app session created when Claude sent you through the root sign-in page.

### I want to refresh my data

Use:

```text
/instagram-insights:sync
```

This uses the same sync queueing behavior as `POST /api/v1/sync-runs`.

### I want to inspect the backend directly

The supported human-facing page is:

```text
https://YOUR_APP_DOMAIN/developers
```

That page includes install guidance, status hints, and legacy API key access for compatibility workflows.
The root page (`https://YOUR_APP_DOMAIN/`) is reserved for Claude's connector-auth handoff.
