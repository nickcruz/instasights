# Stateless NestJS Instagram API Refactor

## Context

Instasights currently performs a durable “sync”: it fetches Instagram profile data, account insights, media, per-media metrics/comments, and optional transcripts, then stores sync runs, snapshots, media, reports, and workflow state in Postgres. That architecture also carries a Next.js UI, Vercel Workflow integration, a Python transcription service, AWS CDK, ECS/Fargate deployment, and S3-based CLI distribution.

The intended product is much smaller: Claude Code authenticates one Instagram professional account and queries live Instagram analytics through a thin API wrapper. There should be no ingestion job, analytics database, worker, transcription service, EC2/ECS/Fargate deployment, or stored reporting layer.

Target outcome:

```text
Claude Code skill → bundled Instasights CLI → stateless NestJS API → Instagram Graph API
```

The backend will be one portable NestJS OCI image. Vercel will deploy it through `Dockerfile.vercel` using Vercel Functions Container Images. The same image must run locally with Docker.

## Approach

### 1. Replace stored analytics with live passthrough requests

Create a NestJS API that exposes only an allowlisted analytics surface:

- `GET /health`
- `GET /auth/instagram/start`
- `GET /auth/instagram/callback`
- `POST /auth/refresh`
- `GET /v1/instagram/me`
- `GET /v1/instagram/me/insights`
- `GET /v1/instagram/media`
- `GET /v1/instagram/media/:mediaId`
- `GET /v1/instagram/media/:mediaId/insights`

Requests will call `graph.instagram.com` live. Supported Instagram query parameters and cursor pagination will pass through; responses will preserve Instagram’s `data`, `paging`, useful errors, and rate-limit information. There will be no generic arbitrary-path proxy.

### 2. Make authentication stateless and local-first

Remove Google sign-in, NextAuth, custom CLI OAuth client registration, developer API keys, and database-backed OAuth records.

The CLI will initiate Instagram OAuth using a loopback callback and PKCE. The NestJS callback will exchange the Instagram authorization code using the app secret, then issue an encrypted, expiring opaque credential containing the Instagram token and account identity. Claude’s installed skill stores that opaque credential only in its local `.auth/state.json`; it must never print the raw Instagram token or place it in model context.

The API will decrypt the credential per request and call Instagram. Refresh will issue a replacement credential. No application database is planned unless product requirements require server-side revocation or cross-device sessions.

### 3. Keep analysis in Claude, not the server

Remove sync/snapshot/report APIs and commands. The CLI will expose live JSON commands for account insights, media listing, media details, and media insights. Claude will paginate, aggregate, compare, and interpret those results in the active session.

### 4. Collapse deployment to one NestJS image

The NestJS app will bind to `0.0.0.0:$PORT`. A multi-stage `Dockerfile.vercel` will build and run the app as a non-root user. Vercel will route traffic to the OCI image; the image will also be testable with ordinary `docker build` and `docker run` commands.

Vercel Container Images are currently Beta, so the NestJS server must remain platform-neutral and avoid Vercel-specific application code.

## Files to modify

This list will be finalized after the open product decisions below are resolved.

### Create / replace

- `src/main.ts` — Nest bootstrap, validation, security headers, and `$PORT` binding
- `src/app.module.ts` — root module
- `src/config/*` — validated environment configuration
- `src/auth/*` — Instagram OAuth state, callback, credential encryption, refresh, and auth guard
- `src/instagram/*` — allowlisted Graph client, controllers, DTOs, pagination, and error handling
- `src/health/*` — health endpoint
- `test/*` — unit, integration, OAuth, and live-contract tests
- `Dockerfile.vercel` — single production OCI image
- `nest-cli.json`, `tsconfig*.json` — Nest build configuration; Vercel automatically detects the root `Dockerfile.vercel`, so no `vercel.json` is required
- `package.json`, `yarn.lock` — reduced dependencies and scripts

### Retain and simplify

- `packages/cli/src/*` — replace stored-data/sync commands with live API commands
- `skills/instasights/SKILL.md` — one Claude-driven login/query workflow
- `skills/instasights/CLI.md` — minimal command reference
- `.claude-plugin/plugin.json` and marketplace metadata — corrected Anthropic-compatible package
- `.env.example`, `README.md`, `docs/claude-plugin-setup.md` — minimal setup/deployment documentation

### Remove after replacement is verified

- `apps/web/`
- `packages/db/`
- `packages/infra/`
- `services/transcriber/`
- workflow/snapshot/report/transcriber contracts in `packages/contracts/`
- `.github/workflows/transcriber-ci.yml`
- `.github/workflows/transcriber-deploy.yml`
- AWS/S3 CLI publication and self-update machinery
- stale hosted MCP configuration and documentation

## Reuse

- `apps/web/lib/instagram-oauth.ts` — Instagram authorize URL, code exchange, profile lookup, scopes, and Graph version handling
- `apps/web/lib/instagram-sync.ts` — only the low-level Graph request, field selection, insight metric, and cursor-pagination logic; do not port orchestration or persistence
- `packages/cli/src/oauth.ts` — loopback callback and browser-opening behavior, simplified to direct Instagram login
- `packages/cli/src/auth-store.ts` — local skill-scoped credential storage
- `packages/cli/src/api-client.ts` — bearer requests and JSON response handling
- `packages/cli/src/media-query.ts` — media query parameter construction where it still matches live Graph semantics
- `skills/instasights/.skillignore` — exclusion of local `.auth/` and `.cache/` data from packaging

## Steps

- [x] Confirm the deployment, auth-state, and API-scope decisions listed below.
- [x] Record the exact live Instagram Graph endpoints, fields, metrics, permissions, pagination semantics, and token lifetime required by the retained CLI commands.
- [x] Add focused contract tests around the reusable OAuth and Graph behavior.
- [x] Scaffold the NestJS application and validated environment configuration.
- [x] Implement signed OAuth state, loopback callback allowlisting, proof-bound encrypted credentials, refresh, and bearer authentication.
- [x] Implement the allowlisted live Instagram Graph client and controllers.
- [x] Preserve upstream paging and actionable errors while preventing arbitrary Graph requests, token leakage, and unsafe query parameters.
- [x] Rewrite the CLI around `login`, `logout`, `status`, `account`, `insights`, `media list`, `media get`, and `media insights`.
- [x] Rewrite the Claude skill so a natural-language request triggers login when needed and live analytics calls without mentioning sync.
- [x] Add `Dockerfile.vercel`, automatic Vercel container detection, health checks, graceful shutdown, and local Docker support.
- [x] Deploy the OCI image to Vercel and validate live Instagram OAuth, account insights, media pagination, and per-media insights against the production callback.
- [x] Remove the old Next.js, database, workflow, transcription, AWS, stored-reporting, updater, and dead MCP surfaces.
- [x] Correct the Claude marketplace package and installation instructions, then validate a completely fresh isolated Claude Code installation.
- [x] Cut over `instasights.kingscrosslabs.com` after the fresh isolated Claude install and live Instagram acceptance flow passed.

## Verification

### Automated

- Unit tests for OAuth state signing/expiry, loopback URL validation, credential authenticated encryption, credential expiry, refresh, and redaction.
- Integration tests with a mocked Instagram API for profile, account insights, media pagination, media detail, media insights, upstream `400`/`401`/`429`/`5xx`, and timeout behavior.
- Contract tests confirming only allowlisted fields, metrics, and query parameters reach Instagram.
- CLI tests confirming stdout contains only final JSON and stderr contains diagnostics without credentials.
- Container build and health check using `Dockerfile.vercel`.
- Nest build, typecheck, lint, and test suite in CI.

### Manual end-to-end

1. Install the Claude plugin into a clean Claude Code environment.
2. Ask Claude to connect Instagram and analyze the last 30 days.
3. Complete Instagram OAuth in the browser.
4. Confirm the CLI stores only an opaque local credential.
5. Fetch live profile and account insights.
6. Paginate recent media and fetch metrics for selected items.
7. Confirm Claude can answer comparative analytics questions without any sync command or database writes.
8. Revoke or expire the Instagram token and verify reauthentication is clear and safe.
9. Run the same image locally and on Vercel.

## Open decisions

1. **Vercel runtime:** proceed with Vercel’s Beta OCI Container Images using `Dockerfile.vercel`, rather than standard zero-config NestJS Functions.
2. **Credential model:** proceed with no database and an encrypted bearer credential stored locally by the Claude skill. This favors simplicity but provides no individual server-side revocation beyond expiry and Meta revocation.
3. **API scope:** retain only profile, account insights, media listing/detail, and media insights. Remove comments, messaging, transcription, HTML reports, and all stored historical analysis.
4. **Frontend:** remove the Next.js UI entirely. NestJS will return only minimal OAuth success/error HTML where a browser response is required.
5. **Distribution:** remove S3/self-update infrastructure and distribute the bundled CLI solely through the Claude marketplace/Git repository.
