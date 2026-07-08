#!/usr/bin/env bash
# Simulate a GitHub push webhook to OPAL server (ADR 0011).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS="$ROOT/deploy/opal/dev-secrets.env"
OPAL_URL="${CHEX_OPAL_SERVER_URL:-http://localhost:7002}"

if [[ ! -f "$SECRETS" ]]; then
  echo "trigger-opal-policy-webhook: missing $SECRETS (run generate-opal-dev-secrets.sh)" >&2
  exit 1
fi

OPAL_POLICY_REPO_WEBHOOK_SECRET="$(grep '^OPAL_POLICY_REPO_WEBHOOK_SECRET=' "$SECRETS" | cut -d= -f2- | tr -d '"')"
if [[ -z "$OPAL_POLICY_REPO_WEBHOOK_SECRET" ]]; then
  echo "trigger-opal-policy-webhook: OPAL_POLICY_REPO_WEBHOOK_SECRET unset" >&2
  exit 1
fi

payload='{"ref":"refs/heads/main","repository":{"full_name":"SafetyMP/healthcare-policy"}}'
signature=$(printf '%s' "$payload" | openssl dgst -sha256 -hmac "$OPAL_POLICY_REPO_WEBHOOK_SECRET" | awk '{print $2}')

curl -fsS -X POST "${OPAL_URL}/webhook" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=${signature}" \
  -d "$payload"

echo ""
echo "OPAL policy webhook triggered at ${OPAL_URL}/webhook"
