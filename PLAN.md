# Instasights MCP

Instasights is an MCP-only remote Streamable HTTP server. The production endpoint is
`https://instasights.kingscrosslabs.com/mcp` and the Meta callback remains
`/api/callback`.

The server is stateless and exposes five typed, read-only tools: profile, account
insights, media list, media item, and media insights. OAuth uses protected-resource
and authorization-server discovery, dynamic client registration, authorization
code with S256 PKCE, and encrypted audience-bound bearer credentials. Instagram
Graph access is allowlisted and cursor-only; tokens and secrets are never emitted
in tool output or logs.
