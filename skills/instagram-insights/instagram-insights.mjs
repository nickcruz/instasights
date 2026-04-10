#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export INSTAGRAM_INSIGHTS_SKILL_ROOT="$SCRIPT_DIR"
node "$SCRIPT_DIR/install-cli.mjs" --ensure-only

exec node "$SCRIPT_DIR/bin/instagram-insights.mjs" "$@"
