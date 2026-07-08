#!/usr/bin/env bash
# Cloud Healthcare Exchange — Definition of Done (hermetic).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== verify: harness =="
./scripts/check-harness.sh

echo "== verify: go (gateway) =="
(
  cd services/gateway
  gofmt -l . | tee /tmp/gofmt.out
  if [[ -s /tmp/gofmt.out ]]; then
    echo "gofmt: files need formatting" >&2
    exit 1
  fi
  go vet ./...
  go test ./...
)

echo "== verify: python (ai-governance) =="
(
  cd services/ai-governance
  VENV=".venv"
  if [[ ! -x "$VENV/bin/python" ]]; then
    python3 -m venv "$VENV"
    "$VENV/bin/pip" install -q -e ".[dev]"
  fi
  "$VENV/bin/ruff" check chex_ai_governance tests
  "$VENV/bin/pytest" -q
)

echo "== verify: opa policy =="
./scripts/ensure-opa.sh
"$ROOT/.tools/bin/opa" test policy/

echo "verify: ok"
