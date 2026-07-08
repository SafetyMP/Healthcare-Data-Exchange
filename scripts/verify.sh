#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [[ -x ./scripts/check-harness.sh ]]; then
  ./scripts/check-harness.sh
else
  echo "TODO: add real test/lint commands from CI" >&2
  exit 1
fi
echo "verify: ok"
