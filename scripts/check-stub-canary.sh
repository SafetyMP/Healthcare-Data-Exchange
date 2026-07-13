#!/usr/bin/env bash
# DO_NOT_DELETE_STUB_CANARY — detect fake OPA stubs and query-param trust bypasses.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

errors=0

fail_if() {
  local label="$1"
  shift
  if "$@"; then
    echo "STUB_CANARY: $label" >&2
    errors=$((errors + 1))
  fi
}

canary_match() {
  local pattern="$1"
  shift
  if command -v rg >/dev/null 2>&1; then
    rg -q "$pattern" "$@"
  else
    grep -rEq "$pattern" "$@"
  fi
}

fail_if "allowOPA stub in gateway tests" \
  canary_match 'func[[:space:]]+allowOPA[[:space:]]*' services/gateway/
fail_if "denyOPA stub in gateway tests" \
  canary_match 'func[[:space:]]+denyOPA[[:space:]]*' services/gateway/
fail_if "query-param jurisdiction override in handlers" \
  canary_match 'Query\(\)\.Get\("requester_jurisdiction"\)|Query\(\)\.Get\("cross_bloc_permitted"\)' \
  services/gateway/internal/handlers/

if [[ -f scripts/verify.sh ]] && grep -q 'TODO: add real test' scripts/verify.sh; then
  echo "STUB_CANARY: placeholder verify.sh" >&2
  errors=$((errors + 1))
fi

if [[ "$errors" -gt 0 ]]; then
  echo "check-stub-canary: FAILED ($errors)" >&2
  exit 1
fi

echo "check-stub-canary: ok"
