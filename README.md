# Instagram Insights

<p align="center">
  <a href="#install"><img alt="Skill + CLI" src="https://img.shields.io/badge/Skill-CLI%20First-D97757?style=for-the-badge"/></a>
  <a href="./LICENSE"><img alt="License MIT" src="https://img.shields.io/badge/License-MIT-16A34A?style=for-the-badge"/></a>
</p>

<p align="center">
  <a href="./apps/web"><img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white&style=for-the-badge"/></a>
  <a href="./packages/cli"><img alt="TypeScript CLI" src="https://img.shields.io/badge/TypeScript-CLI-3178C6?logo=typescript&logoColor=white&style=for-the-badge"/></a>
  <a href="./services/transcriber"><img alt="FastAPI Whisper" src="https://img.shields.io/badge/FastAPI-Whisper-009688?logo=fastapi&logoColor=white&style=for-the-badge"/></a>
</p>

Instagram Insights is a skill-first Instagram analytics workflow built around one installable skill, a bundled TypeScript CLI, a hosted REST API, and durable sync/transcription services.

## What This Repo Contains

- A hosted web app in `apps/web` that exposes `/`, `/developers`, OAuth routes, `/api/login`, `/api/callback`, and `/api/v1/*`.
- A bundled CLI in `packages/cli` that authenticates with OAuth PKCE, stores tokens inside the installed skill folder, and wraps the hosted API.
- Shared packages in `packages/*` for contracts, database access, and infrastructure definitions.
- A transcriber service in `services/transcriber` used by the sync pipeline.
- One installable skill under `skills/instagram-insights`.

## Install

Add the repository as a Claude marketplace and install the skill package:

```text
/plugin marketplace add https://github.com/kingscrosslabs/marketplace.git
/plugin install instagram-insights@kingscrosslabs-marketplace
```

After install, run the skill wrapper so it can bootstrap the latest CLI runtime into the skill before executing commands:

```bash
./skills/instagram-insights/instagram-insights.mjs auth login
./skills/instagram-insights/instagram-insights.mjs setup status
./skills/instagram-insights/instagram-insights.mjs sync run --wait
```

## Supported CLI Commands

- `auth login`
- `auth status`
- `auth logout`
- `setup status`
- `account overview`
- `snapshot latest`
- `media list`
- `media get <mediaId>`
- `sync list`
- `sync get <syncRunId>`
- `sync run [--wait]`
- `instagram link [--open]`
- `update check [--apply] [--force]`
- `update apply [--force]`

All data-returning commands default to JSON output.

## CLI Updates

- The committed skill wrapper installs the CLI runtime into `skills/instagram-insights/bin/` on first run instead of relying on a checked-in built file.
- If `bin/` is missing, the wrapper downloads the latest version from S3 through `INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL`, or uses a local `yarn build:cli` output when you are developing in the repo.
- After bootstrap, the downloaded CLI continues checking for newer releases through its normal self-update flow.
- Published CLI bundles are versioned independently and store the installed version in `skills/instagram-insights/bin/instagram-insights.version.json`.
- If the version file is missing, the updater treats the install as legacy and prefers the newest published release.
- To inspect or force the updater manually, run:

```bash
./skills/instagram-insights/instagram-insights.mjs update check
./skills/instagram-insights/instagram-insights.mjs update apply
./skills/instagram-insights/instagram-insights.mjs update check --apply --force
```

## Auth Model

- The CLI registers a public OAuth client against `/oauth/register`.
- The browser handoff completes Google sign-in on the hosted app.
- The CLI receives the callback on `127.0.0.1`, exchanges the code at `/oauth/token`, and stores auth state in `skills/instagram-insights/.auth/state.json`.
- Instagram linking still happens through the hosted `/api/login` handoff.

## Hosted API

The skill and CLI talk to the authenticated REST surface under `/api/v1/*`:

- `GET /api/v1/account`
- `GET /api/v1/snapshot/latest`
- `GET /api/v1/media`
- `GET /api/v1/media/:mediaId`
- `GET /api/v1/sync-runs`
- `GET /api/v1/sync-runs/:syncRunId`
- `POST /api/v1/sync-runs`

Legacy developer API keys are still supported for compatibility scripts.

## MCP Deprecation

- `/mcp` now returns `410 Gone`.
- `/.well-known/oauth-protected-resource/mcp` now returns `410 Gone`.
- The supported path is the Instagram Insights skill plus bundled CLI.

## Local Development

Install dependencies:

```bash
yarn install --frozen-lockfile
```

Useful commands:

```bash
yarn build:cli
yarn typecheck
yarn test:cli
yarn test:web
python3 -m pytest services/transcriber/tests
```

The generated CLI bundle written into the skill lives at:

```text
skills/instagram-insights/bin/instagram-insights.mjs
```

## License

MIT. See [LICENSE](./LICENSE).
