# Claude Code Setup

## Install

Run these commands inside Claude Code:

```text
/plugin marketplace add nickcruz/instasights
/plugin install instasights@instasights-plugins
```

## Use

Ask Claude:

> Connect my Instagram account and analyze the last 30 days.

Claude will run the installed Instasights skill. If login is needed, a browser opens directly to Instagram authorization. The credential and its local proof remain under the installed skill's ignored `.auth/` directory.

No Google login, manual sync, database, MCP server, or API key is involved.

## Requirements

- Claude Code
- Node.js 20 or newer
- An Instagram professional account
- A browser on the same machine as Claude Code

## Manual troubleshooting

From the installed skill directory:

```bash
./instasights status
./instasights login
./instasights account
./instasights insights --days 30
./instasights media list --days 30
```

Set `INSTASIGHTS_API_URL` only when testing a local or staging API.
