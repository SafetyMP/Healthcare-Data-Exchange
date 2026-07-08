#!/usr/bin/env bash
# Render docs/assets/social-preview.svg to PNG (1280px wide).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
cat docs/assets/social-preview.svg | npx --yes @resvg/resvg-js-cli --fit-width 1280 - docs/assets/social-preview.png
cp docs/assets/social-preview.png .github/social-preview.png
echo "Rendered docs/assets/social-preview.png and .github/social-preview.png"
