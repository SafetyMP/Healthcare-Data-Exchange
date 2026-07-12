#!/usr/bin/env bash
# Render docs/assets/social-preview.svg to PNG (1280px wide).
set -euo pipefail
exec "$(cd "$(dirname "$0")" && pwd)/render-assets.sh"
