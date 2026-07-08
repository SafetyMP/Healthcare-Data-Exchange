#!/usr/bin/env bash
# Verify canonical policy bundle hash matches sync stamp (ADR 0011 PoC integrity).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$ROOT/.harness/policy-sync-stamp"

rego_bundle_hash() {
  find "$ROOT/policy" -maxdepth 1 -name '*.rego' ! -name '*_test.rego' -print0 \
    | sort -z \
    | xargs -0 cat 2>/dev/null \
    | shasum -a 256 \
    | awk '{print $1}'
}

if [[ ! -d "$ROOT/policy" ]]; then
  echo "check-policy-bundle: no policy/ directory" >&2
  exit 1
fi

HASH="$(rego_bundle_hash)"

if [[ ! -f "$STAMP" ]]; then
  echo "check-policy-bundle: no stamp (run ./scripts/sync-policy-repo.sh after policy changes)" >&2
  exit 1
fi

STAMP_HASH="$(awk -F': ' '/^rego_bundle_hash:/{print $2}' "$STAMP" | tr -d ' "')"
if [[ -z "$STAMP_HASH" ]]; then
  echo "check-policy-bundle: invalid stamp file" >&2
  exit 1
fi

if [[ "$HASH" != "$STAMP_HASH" ]]; then
  echo "check-policy-bundle: drift — run ./scripts/sync-policy-repo.sh" >&2
  echo "  local:  $HASH" >&2
  echo "  stamp:  $STAMP_HASH" >&2
  exit 1
fi

echo "check-policy-bundle: ok ($HASH)"
