# Hosted MCP Deployment

This document is retained as a deprecation note.

The hosted MCP deployment path has been retired in favor of the Instagram Insights skill plus bundled CLI.

## Current status

- `/mcp` is deprecated and returns `410 Gone`
- `/.well-known/oauth-protected-resource/mcp` is deprecated and returns `410 Gone`
- `/oauth/*` remains active for the skill-local CLI OAuth flow
- `/api/v1/*` remains the supported authenticated data surface

## Replacement workflow

1. Install the Instagram Insights skill from the marketplace
2. Run `auth login`
3. Run `setup status`
4. Run `instagram link --open` if the account is not linked
5. Run `sync run --wait` when data is stale

## Notes

The existing OAuth storage tables are still used internally, but the public product surface is now the skill and bundled Node-based CLI rather than the hosted MCP server.
