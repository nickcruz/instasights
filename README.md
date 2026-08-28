# Instasights

Instasights is a small, stateless Instagram analytics wrapper built for Claude Code. A bundled CLI handles Instagram authorization and calls a NestJS API that forwards allowlisted requests to the live Instagram Graph API.

There is no analytics database, sync job, worker, report store, transcription service, MCP server, or AWS infrastructure.

## Install in Claude Code

```text
/plugin marketplace add nickcruz/instasights
/plugin install instasights@instasights-plugins
```

Then ask Claude:

> Connect my Instagram account and analyze the last 30 days.

Claude uses the bundled skill to open Instagram authorization and query live profile, account-insight, media, and per-media insight data.

## Local API development

```bash
yarn install
yarn dev
```

Required environment variables are documented in `.env.example`. The Instagram redirect URI is:

```text
https://YOUR_DOMAIN/api/callback
```

## Validation

```bash
yarn typecheck
yarn lint
yarn test
yarn build
docker build -f Dockerfile.vercel -t instasights .
```

## Deployment

`Dockerfile.vercel` is compatible with Vercel Functions Container Images and ordinary OCI hosts. The server listens on `0.0.0.0:$PORT` and stores no local state.

See [Vercel's container-image documentation](https://vercel.com/docs/functions/container-images) and [NestJS on Vercel](https://vercel.com/docs/frameworks/backend/nestjs).

## API

All analytics endpoints require the opaque credential and local proof managed by the CLI.

```text
GET  /health
GET  /auth/instagram/start
GET  /auth/instagram/callback (also `/api/callback` for the existing Meta app)
POST /auth/instagram/refresh
GET  /v1/instagram/me
GET  /v1/instagram/me/insights
GET  /v1/instagram/media
GET  /v1/instagram/media/:mediaId
GET  /v1/instagram/media/:mediaId/insights
```

Responses preserve Instagram `data` and cursor paging. Full upstream paging URLs are removed because they can contain access tokens. See [`docs/instagram-api-contract.md`](docs/instagram-api-contract.md) for the retained scopes, endpoints, metrics, token lifecycle, and data limitations.
