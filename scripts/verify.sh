#!/usr/bin/env bash
# Cloud Healthcare Exchange — Definition of Done (hermetic).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== verify: harness =="
./scripts/check-harness.sh

echo "== verify: image pins =="
if grep -E 'image: .+:latest' deploy/docker-compose.yml; then
  echo "compose images must be digest-pinned" >&2
  exit 1
fi
grep -Fq 'hapiproject/hapi:v8.12.0-2@sha256:0ff86aac4c7bd13a1ee226444a70263bb46ed1c28ef543c30a44f865b80ca04e' deploy/docker-compose.yml
grep -Fq 'permitio/opal-server:0.9.9-alpine@sha256:ccd5ab83b089d3442263e3438dddcd36e3568406dd6dc9a59bd32e4219189601' deploy/docker-compose.yml
grep -Fq 'permitio/opal-client:0.9.9-alpine@sha256:6799a0f66cf6a347a95b226fcc9ec304dd872220ec37e7c4ff498f6383b1784b' deploy/docker-compose.yml
grep -Fq 'postgres:16-alpine@sha256:721873c34ceb9f8d8fc265984940dc982404c105f19ad51be9fdc5970a6080ea' deploy/docker-compose.yml

echo "== verify: threat model =="
./scripts/check-threat-model.sh

echo "== verify: portfolio =="
./scripts/check-portfolio.sh

echo "== verify: opal hardening =="
./scripts/check-opal-hardening.sh
./scripts/check-policy-bundle.sh

echo "== verify: opal policy =="
./scripts/ensure-opa.sh
"$ROOT/.tools/bin/opa" test policy/

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

echo "verify: ok"
