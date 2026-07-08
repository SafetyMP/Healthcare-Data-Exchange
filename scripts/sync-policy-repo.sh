#!/usr/bin/env bash
# Mirror policy/*.rego to the OPAL-tracked policy repo (ADR 0007).
# Canonical, unit-tested source is policy/ in this repo; OPAL tracks the mirror.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
POLICY_REPO_URL="${CHEX_POLICY_REPO_URL:-https://github.com/SafetyMP/healthcare-policy}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

CANONICAL_COMMIT="$(git -C "$ROOT" rev-parse HEAD)"
CANONICAL_SHORT="$(git -C "$ROOT" rev-parse --short HEAD)"

rego_bundle_hash() {
  find "$ROOT/policy" -maxdepth 1 -name '*.rego' ! -name '*_test.rego' -print0 \
    | sort -z \
    | xargs -0 shasum -a 256 2>/dev/null \
    | shasum -a 256 \
    | awk '{print $1}'
}

BUNDLE_HASH="$(rego_bundle_hash)"

echo "Cloning $POLICY_REPO_URL ..."
git clone -q "$POLICY_REPO_URL" "$WORK/repo"

cp "$ROOT"/policy/*.rego "$WORK/repo/" 2>/dev/null || true
rm -f "$WORK"/repo/*_test.rego

mkdir -p "$WORK/repo/.harness"
cat > "$WORK/repo/.harness/canonical-pointer" <<EOF
# Canonical source pointer — updated by Healthcare-Data-Exchange sync-policy-repo.sh
canonical_repo: https://github.com/SafetyMP/Healthcare-Data-Exchange
canonical_commit: ${CANONICAL_COMMIT}
rego_bundle_hash: ${BUNDLE_HASH}
synced_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

if [[ ! -f "$WORK/repo/.manifest" ]]; then
  echo '{"roots":["chex"]}' > "$WORK/repo/.manifest"
fi

cd "$WORK/repo"
if git diff --quiet && git diff --cached --quiet; then
  echo "policy repo already up to date."
else
  git add -A
  git commit -q -m "sync: policy from Healthcare-Data-Exchange@${CANONICAL_SHORT}"
  git push -q origin HEAD
  echo "policy repo updated; OPAL will pick up changes on its next poll."
fi

mkdir -p "$ROOT/.harness"
cat > "$ROOT/.harness/policy-sync-stamp" <<EOF
# Updated by sync-policy-repo.sh — used by check-policy-sync.sh
canonical_commit: ${CANONICAL_COMMIT}
rego_bundle_hash: ${BUNDLE_HASH}
synced_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
mirror_url: ${POLICY_REPO_URL}
EOF

echo "policy-sync-stamp written (.harness/policy-sync-stamp)"
