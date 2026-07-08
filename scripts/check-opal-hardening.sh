#!/usr/bin/env bash
# Hermetic checks for OPAL hardening wiring (ADR 0011).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail() {
  echo "check-opal-hardening: $*" >&2
  exit 1
}

[[ -f config/opal-hardening.yaml ]] || fail "missing config/opal-hardening.yaml"
[[ -f deploy/opal/secrets.example ]] || fail "missing deploy/opal/secrets.example"
[[ -f deploy/opal/entrypoint-client.sh ]] || fail "missing deploy/opal/entrypoint-client.sh"
[[ -f docs/adr/0011-opal-production-hardening.md ]] || fail "missing ADR 0011"
[[ -x scripts/generate-opal-dev-secrets.sh ]] || fail "generate-opal-dev-secrets.sh not executable"
[[ -x scripts/trigger-opal-policy-webhook.sh ]] || fail "trigger-opal-policy-webhook.sh not executable"
[[ -x scripts/check-policy-bundle.sh ]] || fail "check-policy-bundle.sh not executable"

grep -q 'env_file:' deploy/docker-compose.yml \
  || fail "docker-compose.yml missing env_file for OPAL secrets"
grep -q 'CHEX_OPAL_SECURE' deploy/docker-compose.yml \
  || fail "docker-compose.yml missing CHEX_OPAL_SECURE wiring"
grep -q 'entrypoint-client.sh' deploy/docker-compose.yml \
  || fail "docker-compose.yml missing secure opal-client entrypoint"
grep -q 'OPAL_POLICY_REPO_WEBHOOK_SECRET' deploy/opal/secrets.example \
  || fail "secrets.example missing webhook secret key"

grep -q 'Authorization' services/consent-service/chex_consent/opal_publish.py \
  || fail "consent opal_publish missing auth header support"

echo "check-opal-hardening: ok"
