#!/usr/bin/env bash
# Verify canonical policy bundle hash matches sync stamp (ADR 0011 PoC integrity).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$ROOT/.harness/policy-sync-stamp"
# shellcheck source=lib/portfolio.sh
source "$ROOT/scripts/lib/portfolio.sh"

rego_bundle_hash() {
  find "$ROOT/policy" -maxdepth 1 -name '*.rego' ! -name '*_test.rego' -print0 \
    | LC_ALL=C sort -z \
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

published_commit="$(portfolio_field "$STAMP" published_commit)"
published_hash="$(portfolio_field "$STAMP" published_bundle_hash)"
if [[ -z "$published_commit" || -z "$published_hash" ]]; then
  echo "check-policy-bundle: stamp missing published_commit or published_bundle_hash" >&2
  exit 1
fi

commit_hash="$(portfolio_commit_rego_bundle_hash "$ROOT" "$published_commit")"
if [[ "$commit_hash" != "$published_hash" ]]; then
  echo "check-policy-bundle: published commit ${published_commit} policy hash disagrees with published_bundle_hash" >&2
  echo "  commit:    $commit_hash" >&2
  echo "  published: $published_hash" >&2
  exit 1
fi

if [[ -n "${CHEX_PORTFOLIO_MIRROR_PATH:-}" ]]; then
  mirror_hash="$(portfolio_rego_bundle_hash "$CHEX_PORTFOLIO_MIRROR_PATH")"
  if [[ "$published_hash" != "$mirror_hash" ]]; then
    echo "check-policy-bundle: published_bundle_hash disagrees with the mirror" >&2
    echo "  published: $published_hash" >&2
    echo "  mirror:    $mirror_hash" >&2
    exit 1
  fi
fi

if [[ "$HASH" != "$STAMP_HASH" ]]; then
  echo "check-policy-bundle: drift — run ./scripts/sync-policy-repo.sh" >&2
  echo "  local:  $HASH" >&2
  echo "  stamp:  $STAMP_HASH" >&2
  exit 1
fi

echo "check-policy-bundle: ok ($HASH)"
