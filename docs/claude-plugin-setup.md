# Claude MCP Setup

## Install

Run inside Claude Code or Claude Code in the Claude Desktop app:

```text
/plugin marketplace add https://github.com/kingscrosslabs/marketplace.git
/plugin install instasights@kingscrosslabs-marketplace
```

The plugin contains only a remote MCP configuration pointing to:

```text
https://instasights.kingscrosslabs.com/mcp
```

It does not install a CLI, skill, Node.js runtime, or local token file.

## Connect Instagram

Ask Claude:

> Connect my Instagram account and analyze the last 30 days.

Claude discovers the MCP OAuth endpoints and opens Instagram Login in the browser. After approval, Claude stores an opaque encrypted MCP bearer credential; the raw Instagram token is never shown to Claude or returned by a tool.

## Available tools

- `instagram_get_profile` — profile fields for the connected professional account
- `instagram_get_account_insights` — selected account metrics and time ranges
- `instagram_list_media` — cursor-paginated media
- `instagram_get_media` — one media item by numeric ID
- `instagram_get_media_insights` — selected metrics for one media item

Tool inputs are visible in Claude and enumerate every supported field and metric. The server rejects arbitrary Graph paths and unsupported arguments.

## Requirements

- An Instagram Business or Creator account
- A browser available to the MCP client
- A Claude client with remote Streamable HTTP MCP and OAuth support

If authentication was cached for an older Instasights MCP configuration, remove and reinstall the plugin so Claude performs fresh discovery and dynamic client registration.
