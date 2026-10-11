#!/usr/bin/env bash
# Fail if canonical policy/*.rego drift from last recorded sync (see .harness/policy-sync-stamp).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$ROOT/.harness/policy-sync-stamp"
POLICY_DIR="$ROOT/policy"
# shellcheck source=lib/portfolio.sh
source "$ROOT/scripts/lib/portfolio.sh"

if [[ ! -d "$POLICY_DIR" ]]; then
  echo "check-policy-sync: no policy/ directory" >&2
  exit 1
fi

HASH="$(portfolio_rego_bundle_hash "$POLICY_DIR")"

if [[ ! -f "$STAMP" ]]; then
  echo "check-policy-sync: no stamp (run ./scripts/sync-policy-repo.sh after policy changes)" >&2
  exit 1
fi

stamped="$(grep '^rego_bundle_hash:' "$STAMP" | awk '{print $2}' || true)"
if [[ -z "$stamped" ]]; then
  echo "check-policy-sync: invalid stamp file" >&2
  exit 1
fi

published_commit="$(portfolio_field "$STAMP" published_commit)"
published_hash="$(portfolio_field "$STAMP" published_bundle_hash)"
if [[ -z "$published_commit" || -z "$published_hash" ]]; then
  echo "check-policy-sync: stamp missing published_commit or published_bundle_hash" >&2
  exit 1
fi

commit_hash="$(portfolio_commit_rego_bundle_hash "$ROOT" "$published_commit")"
if [[ "$commit_hash" != "$published_hash" ]]; then
  echo "check-policy-sync: published commit ${published_commit} policy hash disagrees with published_bundle_hash" >&2
  echo "  commit:    $commit_hash" >&2
  echo "  published: $published_hash" >&2
  exit 1
fi

if [[ -n "${CHEX_PORTFOLIO_MIRROR_PATH:-}" ]]; then
  mirror_hash="$(portfolio_rego_bundle_hash "$CHEX_PORTFOLIO_MIRROR_PATH")"
  if [[ "$commit_hash" != "$mirror_hash" ]]; then
    echo "check-policy-sync: published commit ${published_commit} policy hash disagrees with the mirror" >&2
    echo "  commit: $commit_hash" >&2
    echo "  mirror: $mirror_hash" >&2
    exit 1
  fi
fi

if [[ "$HASH" != "$stamped" ]]; then
  echo "check-policy-sync: policy drift — run ./scripts/sync-policy-repo.sh" >&2
  echo "  stamped:  $stamped" >&2
  echo "  current:  $HASH" >&2
  exit 1
fi

echo "check-policy-sync: ok ($HASH)"
