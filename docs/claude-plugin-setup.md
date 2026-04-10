# Claude Plugin Setup

Instagram Insights now installs as one skill with a bundled Node-based CLI.

## Install from the repository marketplace

```text
/plugin marketplace add https://github.com/kingscrosslabs/marketplace.git
/plugin install instagram-insights@kingscrosslabs-marketplace
```

## What happens during install

1. Claude installs the Instagram Insights skill bundle.
2. The skill exposes a stable launcher at `./instagram-insights` that verifies Node.js 20+ and then calls the bundled runtime at `./bin/instagram-insights.mjs`.
3. The CLI authenticates against the hosted OAuth endpoints under `/oauth/*`.
4. The hosted app finishes Google sign-in in the browser and resumes the waiting localhost callback.
5. The installed skill stores auth state in its own `.auth/state.json` file.
6. The skill's `.skillignore` excludes `.auth/` and `.cache/` so local auth and cache data are not synced or published.

## First run

```bash
./skills/instagram-insights/instagram-insights auth login
./skills/instagram-insights/instagram-insights setup status
```

If setup reports `not_linked`, run:

```bash
./skills/instagram-insights/instagram-insights instagram link --open
```

If setup reports `not_synced` or `stale`, run:

```bash
./skills/instagram-insights/instagram-insights sync run --wait
```

## Troubleshooting

### I need to re-authenticate Google

Run:

```bash
./skills/instagram-insights/instagram-insights auth login
```

### I still need to link Instagram

Run:

```bash
./skills/instagram-insights/instagram-insights instagram link --open
```

### I want to inspect the backend directly

Use the support page:

```text
https://YOUR_APP_DOMAIN/developers
```

That page includes status hints, CLI examples, and the legacy API-key path.

Node.js 20+ is required. `INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL` can override the hosted manifest URL when you need to test a staging build.
