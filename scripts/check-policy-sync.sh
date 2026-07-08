#!/usr/bin/env bash
# Fail if canonical policy/*.rego drift from last recorded sync (see .harness/policy-sync-stamp).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$ROOT/.harness/policy-sync-stamp"
POLICY_DIR="$ROOT/policy"

if [[ ! -d "$POLICY_DIR" ]]; then
  echo "check-policy-sync: no policy/ directory" >&2
  exit 1
fi

current_hash() {
  # shellcheck source=lib/portfolio.sh
  source "$ROOT/scripts/lib/portfolio.sh"
  portfolio_rego_bundle_hash "$POLICY_DIR"
}

HASH="$(current_hash)"

if [[ ! -f "$STAMP" ]]; then
  echo "check-policy-sync: no stamp (run ./scripts/sync-policy-repo.sh after policy changes)" >&2
  exit 1
fi

stamped="$(grep '^rego_bundle_hash:' "$STAMP" | awk '{print $2}' || true)"
if [[ -z "$stamped" ]]; then
  echo "check-policy-sync: invalid stamp file" >&2
  exit 1
fi

if [[ "$HASH" != "$stamped" ]]; then
  echo "check-policy-sync: policy drift — run ./scripts/sync-policy-repo.sh" >&2
  echo "  stamped:  $stamped" >&2
  echo "  current:  $HASH" >&2
  exit 1
fi

echo "check-policy-sync: ok ($HASH)"
