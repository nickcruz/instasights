# Claude Plugin Setup

Instagram Insights now installs as one skill with a bundled CLI.

## Install from the repository marketplace

```text
/plugin marketplace add https://github.com/kingscrosslabs/marketplace.git
/plugin install instagram-insights@kingscrosslabs-marketplace
```

## What happens during install

1. Claude installs the Instagram Insights skill bundle.
2. The skill exposes a stable wrapper at `./instagram-insights.mjs` that checks for CLI updates before calling `./bin/instagram-insights.mjs`.
3. The CLI authenticates against the hosted OAuth endpoints under `/oauth/*`.
4. The hosted app finishes Google sign-in in the browser and resumes the waiting localhost callback.
5. The installed skill stores auth state in its own `.auth/state.json` file.

## First run

```bash
./skills/instagram-insights/instagram-insights.mjs auth login
./skills/instagram-insights/instagram-insights.mjs setup status
```

If setup reports `not_linked`, run:

```bash
./skills/instagram-insights/instagram-insights.mjs instagram link --open
```

If setup reports `not_synced` or `stale`, run:

```bash
./skills/instagram-insights/instagram-insights.mjs sync run --wait
```

## Troubleshooting

### I need to re-authenticate Google

Run:

```bash
./skills/instagram-insights/instagram-insights.mjs auth login
```

### I still need to link Instagram

Run:

```bash
./skills/instagram-insights/instagram-insights.mjs instagram link --open
```

### I want to inspect the backend directly

Use the support page:

```text
https://YOUR_APP_DOMAIN/developers
```

That page includes status hints, CLI examples, and the legacy API-key path.
