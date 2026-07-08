#!/usr/bin/env bash
# Validate harness scaffold (structure + hook syntax).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

errors=0
PROFILE="$(grep '^profile:' .harness/profile.yaml 2>/dev/null | awk '{print $2}' || echo solo)"

require_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "MISSING: $path" >&2
    errors=$((errors + 1))
  fi
}

echo "== harness: contract (profile=$PROFILE) =="
require_file ".harness/profile.yaml"
require_file ".harness/VERSION"
require_file "AGENTS.md"
require_file "scripts/verify.sh"
require_file ".cursor/hooks.json"

if [[ "$PROFILE" == "fleet" ]]; then
  require_file "specs/MANDATE.md"
fi

echo "== harness: vendored hooks =="
HOOKS=(
  _common.py guard-shell.py guard-mcp.py guard-network.py protect-secrets.py
  scan-prompt.py verify-on-stop.py
)
if [[ "$PROFILE" == "fleet" ]]; then
  HOOKS+=(
    guard-instruction.py session-mode.py session-start.py subagent-handoff.py
  )
fi
for hook in "${HOOKS[@]}"; do
  require_file ".cursor/hooks/$hook"
done

echo "== harness: profile spot-check =="
if ! grep -q "profile: $PROFILE" .harness/profile.yaml; then
  echo "BAD PROFILE: expected $PROFILE in .harness/profile.yaml" >&2
  errors=$((errors + 1))
fi
if ! grep -q 'harness-contract/v1' .harness/profile.yaml; then
  echo "BAD SCHEMA: .harness/profile.yaml" >&2
  errors=$((errors + 1))
fi
if [[ "$PROFILE" == "fleet" ]] && ! grep -qE '^Status:[[:space:]]*ACTIVE' specs/MANDATE.md; then
  echo "BAD MANDATE: specs/MANDATE.md must have Status: ACTIVE for fleet" >&2
  errors=$((errors + 1))
fi

echo "== harness: hooks.json =="
python3 -c "import json; json.load(open('.cursor/hooks.json'))"

echo "== harness: python syntax =="
PY_FILES=(.cursor/hooks/_common.py .cursor/hooks/guard-shell.py .cursor/hooks/guard-mcp.py
  .cursor/hooks/guard-network.py .cursor/hooks/protect-secrets.py .cursor/hooks/scan-prompt.py
  .cursor/hooks/verify-on-stop.py)
if [[ "$PROFILE" == "fleet" ]]; then
  PY_FILES+=(
    .cursor/hooks/guard-instruction.py .cursor/hooks/session-mode.py
    .cursor/hooks/session-start.py .cursor/hooks/subagent-handoff.py
  )
fi
python3 -m py_compile "${PY_FILES[@]}"

if [[ "$errors" -gt 0 ]]; then
  echo "check-harness: FAILED ($errors errors)" >&2
  exit 1
fi

echo "check-harness: ok"
