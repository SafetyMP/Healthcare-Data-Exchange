#!/usr/bin/env bash
# Validate solo harness scaffold (structure + hook syntax).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

errors=0

require_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "MISSING: $path" >&2
    errors=$((errors + 1))
  fi
}

echo "== harness: contract =="
require_file ".harness/profile.yaml"
require_file ".harness/VERSION"
require_file "AGENTS.md"
require_file "scripts/verify.sh"
require_file ".cursor/hooks.json"

echo "== harness: vendored hooks =="
for hook in _common.py guard-shell.py guard-mcp.py guard-network.py protect-secrets.py scan-prompt.py verify-on-stop.py; do
  require_file ".cursor/hooks/$hook"
done

echo "== harness: profile spot-check =="
if ! grep -q 'profile: solo' .harness/profile.yaml; then
  echo "BAD PROFILE: expected solo in .harness/profile.yaml" >&2
  errors=$((errors + 1))
fi
if ! grep -q 'harness-contract/v1' .harness/profile.yaml; then
  echo "BAD SCHEMA: .harness/profile.yaml" >&2
  errors=$((errors + 1))
fi

echo "== harness: hooks.json =="
python3 -c "import json; json.load(open('.cursor/hooks.json'))"

echo "== harness: python syntax =="
python3 -m py_compile .cursor/hooks/_common.py .cursor/hooks/guard-shell.py .cursor/hooks/guard-mcp.py .cursor/hooks/guard-network.py .cursor/hooks/protect-secrets.py .cursor/hooks/scan-prompt.py .cursor/hooks/verify-on-stop.py

if [[ "$errors" -gt 0 ]]; then
  echo "check-harness: FAILED ($errors errors)" >&2
  exit 1
fi

echo "check-harness: ok"
