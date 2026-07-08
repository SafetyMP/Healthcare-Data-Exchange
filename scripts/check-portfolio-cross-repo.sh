#!/usr/bin/env bash
# Cross-repo portfolio checks (canonical). Requires mirror checkout at CHEX_PORTFOLIO_MIRROR_PATH.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/portfolio.sh
source "$ROOT/scripts/lib/portfolio.sh"

MIRROR="${CHEX_PORTFOLIO_MIRROR_PATH:-}"
if [[ -z "$MIRROR" ]]; then
  echo "check-portfolio-cross-repo: skip (set CHEX_PORTFOLIO_MIRROR_PATH)" >&2
  exit 0
fi
if [[ ! -d "$MIRROR" ]]; then
  echo "check-portfolio-cross-repo: mirror path missing: $MIRROR" >&2
  exit 1
fi

STAMP="$ROOT/.harness/policy-sync-stamp"
POINTER="$MIRROR/.harness/canonical-pointer"

echo "== portfolio: cross-repo sync =="
for f in "$STAMP" "$POINTER"; do
  if [[ ! -f "$f" ]]; then
    echo "MISSING: $f" >&2
    exit 1
  fi
done

for field in rego_bundle_hash canonical_commit; do
  s_val="$(portfolio_field "$STAMP" "$field")"
  p_val="$(portfolio_field "$POINTER" "$field")"
  if [[ -z "$s_val" || "$s_val" != "$p_val" ]]; then
    echo "MISMATCH $field: canonical=$s_val mirror=$p_val" >&2
    exit 1
  fi
done

echo "check-portfolio-cross-repo: ok"
