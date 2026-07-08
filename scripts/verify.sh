#!/usr/bin/env bash
# Cloud Healthcare Exchange — Definition of Done (hermetic).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== verify: harness =="
./scripts/check-harness.sh

echo "== verify: portfolio =="
./scripts/check-portfolio.sh

echo "== verify: opal hardening =="
./scripts/check-opal-hardening.sh
./scripts/check-policy-bundle.sh

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

echo "== verify: python (consent-service) =="
(
  cd services/consent-service
  VENV=".venv"
  if [[ ! -x "$VENV/bin/python" ]]; then
    python3 -m venv "$VENV"
    "$VENV/bin/pip" install -q -e ".[dev]"
  fi
  "$VENV/bin/ruff" check chex_consent tests
  CHEX_OPAL_PUBLISH=0 "$VENV/bin/pytest" -q
)

echo "== verify: python (identity-broker) =="
(
  cd services/identity-broker
  VENV=".venv"
  if [[ ! -x "$VENV/bin/python" ]]; then
    python3 -m venv "$VENV"
    "$VENV/bin/pip" install -q -e ".[dev]"
  fi
  "$VENV/bin/ruff" check chex_identity tests
  "$VENV/bin/pytest" -q
)

echo "== verify: opa policy =="
./scripts/ensure-opa.sh
"$ROOT/.tools/bin/opa" test policy/

echo "verify: ok"
