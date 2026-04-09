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
2. Authenticate the remote MCP server with the hosted OAuth flow
3. Store the OAuth credentials locally
4. Expose Claude-visible skills for setup, Instagram linking, sync, and analysis

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

Claude owns the MCP OAuth session. Re-authenticate the hosted MCP server rather than creating a manual Google-auth skill.

### I still need to link Instagram

Use:

```text
/instagram-insights:connect
```

That skill will open the hosted `/api/login` handoff and then have Claude re-check setup status.

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
