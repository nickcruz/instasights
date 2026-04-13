# Skill Bundle Distribution

Instasights publishes two artifact families:

- managed CLI update files under `cli/*`
- a full downloadable skill bundle under `skill/*`

## Local packaging

Build the committed CLI runtime into `skills/instasights/bin/` first:

```bash
yarn build:cli
```

Then package the full skill folder:

```bash
node ./scripts/package-skill-bundle.mjs \
  --base-url "https://YOUR_RELEASES_HOST/skill" \
  --output-root "packages/cli/dist/skill"
```

Or use the convenience script with the default local output root:

```bash
yarn package:skill
```

The packaged zip expands to a top-level `instasights/` folder and includes the committed contents of `skills/instasights/`.

## What gets excluded

The packager copies committed skill files and filters out:

- `.auth/`
- `.cache/`
- `.DS_Store`
- any path listed in `skills/instasights/.skillignore`

## Output layout

Local packaging writes:

```text
packages/cli/dist/skill/
  latest.json
  latest/
    instasights-skill.zip
  <version>/
    instasights-skill.zip
    manifest.json
```

The generated `latest.json` includes:

- `version`
- `publishedAt`
- `zipUrl`
- `latestZipUrl`
- `sha256`
- `size`
- `skillPath`

## Publish workflow

`.github/workflows/publish-cli.yml` now does three things in order:

1. builds the CLI runtime
2. packages the full skill bundle
3. uploads both CLI and skill artifacts to S3

The workflow keeps the existing CLI self-update layout:

```text
cli/<version>/bin/...
cli/latest.json
```

The full skill bundle is published separately:

```text
skill/<version>/instasights-skill.zip
skill/latest/instasights-skill.zip
skill/latest.json
```

The `skill/latest/instasights-skill.zip` object is the canonical target for the Kings Cross download redirect route.
