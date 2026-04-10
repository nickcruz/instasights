# Instagram Insights CLI

This document explains the bundled `instagram-insights` CLI in more detail than the quick command list in the main skill.

Run the launcher from this skill directory so it can bootstrap the signed macOS binary first:

```bash
./instagram-insights
```

If you are in the repository root, use:

```bash
./skills/instagram-insights/instagram-insights
```

## Global behavior

- Target platform: macOS on Apple Silicon.
- The launcher installs the managed binary into `./bin/` on first run.
- OAuth tokens are stored in `./.auth/state.json`.
- Runtime-only state lives in `./.auth/`, `./.cache/`, and `./bin/`.
- Data-returning commands print JSON by default.

## Global options

- `--app-url <url>`
  Use a non-production app origin for local, staging, or preview environments.
- `--json`
  Accepted for compatibility. Most data commands already emit JSON without needing this flag.
- `--no-browser`
  Disables automatic browser launch for OAuth and Instagram linking flows.

## Command Reference

### `auth login [--port <n>]`

Starts the OAuth PKCE login flow against the hosted app.

- Registers or reuses the local public OAuth client.
- Opens the browser unless `--no-browser` is set.
- Receives the callback on `127.0.0.1`.
- Stores access and refresh tokens in `./.auth/state.json`.
- `--port <n>` forces a specific localhost callback port if you need to work around local conflicts.

Use this when the CLI is unauthenticated or when the local auth state has been cleared.

### `auth status`

Prints the current local auth state summary.

It includes:

- whether the CLI is authenticated
- the current app URL
- the registered OAuth client ID
- the redirect URI
- the current token expiry
- whether a refresh token is present

Use this before debugging setup issues so you know whether auth is the blocker.

### `auth logout`

Deletes the stored local auth tokens and resets the CLI to an unauthenticated state.

Use this when you want to re-authenticate from scratch.

### `setup status [--stale-after-hours <n>] [--open-link]`

Checks the overall readiness of the connected Instagram Insights workflow.

This is the best “what should I do next?” command. It inspects:

- authentication state
- whether an Instagram account is linked
- whether a completed sync exists
- whether the latest sync is still fresh enough

It returns a structured setup status with a `recommendedNextAction`.

Flags:

- `--stale-after-hours <n>`
  Changes the freshness threshold used to decide whether the latest sync is stale.
- `--open-link`
  If the setup state is `not_linked`, opens the Instagram linking handoff automatically.

### `clean-reset`

Clears server-side Instagram linkage and synced Instagram data for the authenticated user while preserving CLI authentication.

Use this when you want to restart Instagram setup without logging the CLI out.

This is stronger than `auth logout` in a different direction:

- `auth logout` clears local OAuth state
- `clean-reset` clears linked Instagram and synced backend data

### `account overview`

Fetches the authenticated user’s overall account overview from the hosted API.

This is the best general-purpose summary command when you want:

- linked Instagram account information
- latest sync summary
- high-level status

Use it before deeper debugging or analysis.

### `snapshot latest`

Fetches the latest persisted account snapshot.

Use this when you want the newest normalized analytics payload for analysis without browsing raw media rows.

### `media list [--limit <n>] [--media-type <type>] [--since <iso>] [--until <iso>] [--days <n>] [--flat-metrics]`

Lists media rows for the authenticated user with optional filtering.

Flags:

- `--limit <n>`
  Maximum number of media items to fetch.
- `--media-type <type>`
  Filters by media type such as `IMAGE`, `VIDEO`, `CAROUSEL_ALBUM`, or other stored Instagram types.
- `--since <iso>`
  Only include media on or after the given ISO timestamp.
- `--until <iso>`
  Only include media on or before the given ISO timestamp.
- `--days <n>`
  Only include media from the trailing `n` days.
- `--flat-metrics`
  Includes stored flat metrics and analysis fields directly in the response shape for easier inspection.

Use this to browse recent content, filter by type, or inspect the media set that a sync produced.

### `media get <mediaId>`

Fetches one media item by Instagram media ID.

Use this when you already know the media ID and want full stored detail, including any transcript, metrics, and derived fields attached to that item.

### `media analyze [--days <n>]`

Fetches the precomputed analysis report for the trailing time window.

Right now this command only supports `--days 30`.

Use it when you want the report-style summary rather than raw media rows.

### `report generate [--days <n>] [--output <path>]`

Generates a self-contained HTML dashboard for the trailing time window.

Right now this command only supports `--days 30`.

Flags:

- `--days <n>`
  Supports only `30` in the current implementation.
- `--output <path>`
  Writes the generated HTML report to the provided file path. If omitted, the CLI writes a deterministic `.html` filename into the current working directory.

This command uses the existing precomputed report plus stored media analysis fields to build an interactive static dashboard with:

- overview totals
- a star-post callout
- theme and hook breakdowns
- an expandable all-posts table
- keyword and hashtag sections
- deterministic strategic insights

Use it when you want a portable HTML report instead of raw JSON.

### `sync list [--limit <n>]`

Lists recent sync runs for the authenticated user.

Use this to inspect sync history, queue reuse behavior, and the most recent run IDs before drilling into one run.

### `sync get <syncRunId>`

Fetches one sync run by ID.

Use this when you need detailed run status, progress, or failure information for a specific sync.

### `sync run [--force] [--stale-after-hours <n>] [--wait]`

Requests a new sync run, or reuses the existing freshness logic depending on options.

Flags:

- `--force`
  Forces a new sync even when the current data is fresh.
- `--stale-after-hours <n>`
  Sets the freshness threshold used by the backend when deciding whether a sync is needed.
- `--wait`
  Polls until the queued sync reaches a terminal state and then prints the final run details.

This is the main ingestion trigger command.

### `instagram link [--open]`

Returns the hosted Instagram linking URL and opens it in the browser by default.

Flags:

- `--open`
  Explicitly opens the browser handoff.
- `--no-browser`
  Combined with the global option, suppresses browser launch and only prints the link payload.

Use this when setup status reports `not_linked`.

### `update check [--apply] [--force]`

Checks for a newer published CLI bundle.

Flags:

- `--apply`
  Applies the update immediately after checking.
- `--force`
  Reinstalls even when the version appears unchanged.

Use this when you want to inspect updater state before actually applying anything.

### `update apply [--force]`

Checks for updates and immediately applies the newest published CLI bundle.

Flags:

- `--force`
  Reinstalls the published version even if the current version matches.

Use this when you want to refresh the managed binary without waiting for the normal background update flow.

## Recommended Flows

### First-time setup

```bash
./instagram-insights auth login
./instagram-insights setup status
./instagram-insights instagram link --open
./instagram-insights sync run --wait
```

### Check whether the account is ready for analysis

```bash
./instagram-insights setup status --stale-after-hours 12
```

### Inspect recent content

```bash
./instagram-insights media list --limit 10 --days 30 --flat-metrics
./instagram-insights media get <mediaId>
```

### Force fresh data before analysis

```bash
./instagram-insights sync run --force --wait
./instagram-insights snapshot latest
./instagram-insights media analyze --days 30
```

### Generate an HTML dashboard report

```bash
./instagram-insights report generate --days 30
./instagram-insights report generate --days 30 --output ./output/instagram-insights-report.html
```
