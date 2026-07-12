#!/usr/bin/env bash
# Render docs/assets/*.svg to PNG (1280px wide unless noted).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
render() {
  local svg="$1" png="$2" width="${3:-1280}"
  cat "$svg" | npx --yes @resvg/resvg-js-cli --fit-width "$width" - "$png"
  echo "Rendered $png"
}
render docs/assets/social-preview.svg docs/assets/social-preview.png 1280
cp docs/assets/social-preview.png .github/social-preview.png
render docs/assets/architecture.svg docs/assets/architecture.png 1280
render docs/assets/architecture-detailed.svg docs/assets/architecture-detailed.png 1400
render docs/assets/policy-opal-flow.svg docs/assets/policy-opal-flow.png 1280
echo "Asset render complete."
