#!/usr/bin/env bash
# Render only the social preview and synchronize its publishing copies.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# Reuse the web app's installed image renderer; no network download required.
node <<'NODE'
const sharp = require('./web/node_modules/sharp');
sharp('docs/assets/social-preview.svg')
  .png()
  .toFile('docs/assets/social-preview.png')
  .then(({ width, height }) => {
    if (width !== 1280 || height !== 640) {
      throw new Error(`Expected 1280 x 640, received ${width} x ${height}`);
    }
  })
  .catch((error) => { console.error(error); process.exitCode = 1; });
NODE
mkdir -p .github web/public
cp docs/assets/social-preview.png .github/social-preview.png
cp docs/assets/social-preview.png web/public/social-preview.png
echo "Rendered and synchronized social preview (1280 x 640)."
