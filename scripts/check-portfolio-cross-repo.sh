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

s_hash="$(portfolio_field "$STAMP" published_bundle_hash)"
p_hash="$(portfolio_field "$POINTER" rego_bundle_hash)"
if [[ -z "$s_hash" || "$s_hash" != "$p_hash" ]]; then
  echo "MISMATCH published_bundle_hash: canonical=$s_hash mirror=$p_hash" >&2
  exit 1
fi

commit="$(portfolio_field "$STAMP" published_commit)"
if [[ -z "$commit" ]]; then
  echo "MISSING published_commit in $STAMP" >&2
  exit 1
fi
commit_hash="$(portfolio_commit_rego_bundle_hash "$ROOT" "$commit")"
mirror_hash="$(portfolio_rego_bundle_hash "$MIRROR")"
if [[ "$commit_hash" != "$s_hash" || "$commit_hash" != "$mirror_hash" ]]; then
  echo "MISMATCH published commit policy hash: commit ${commit}=$commit_hash published=$s_hash mirror=$mirror_hash" >&2
  exit 1
fi

echo "check-portfolio-cross-repo: ok"
