#!/usr/bin/env bash
# Upload docs/assets/social-preview.png to GitHub Settings → Social preview.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOL_DIR="$ROOT/scripts/social-preview"
cd "$TOOL_DIR"
npm ci --omit=dev >/dev/null 2>&1
npx playwright install chromium >/dev/null 2>&1 || npx playwright install chromium
node upload.mjs "$@"
