#!/usr/bin/env bash
# Load branch policy into running opal-client OPA before compose E2E (CI + local).
# OPAL polls healthcare-policy on main; PR branches may be ahead of the mirror.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OPA_URL="${CHEX_OPA_URL:-http://localhost:8181}"
GW="${CHEX_GW_URL:-http://localhost:8081}"

echo "== bootstrap-opa-policy: wait for OPA =="
for _ in $(seq 1 60); do
  if curl -fsS "${OPA_URL}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
curl -fsS "${OPA_URL}/health" >/dev/null

echo "== bootstrap-opa-policy: upload branch policy =="
policy_file="${ROOT}/policy/authz.rego"
if [[ ! -f "$policy_file" ]]; then
  echo "MISSING: $policy_file" >&2
  exit 1
fi
upload_code=$(curl -sS -o /tmp/chex-opa-upload.txt -w "%{http_code}" -X PUT \
  "${OPA_URL}/v1/policies/authz" \
  -H "Content-Type: text/plain" \
  --data-binary @"${policy_file}")
if [[ "$upload_code" != "200" ]]; then
  echo "OPA policy upload failed: HTTP ${upload_code}" >&2
  cat /tmp/chex-opa-upload.txt >&2 || true
  exit 1
fi

echo "== bootstrap-opa-policy: probe deny case via gateway =="
US_CLINICIAN_AUTH="Bearer us-clinician-client.demo-us-clinician-secret"
for _ in $(seq 1 30); do
  code=$(curl -s -o /tmp/chex-bootstrap-probe.json -w "%{http_code}" \
    -H "Authorization: ${US_CLINICIAN_AUTH}" \
    "${GW}/v1/patients/patient-eu-001?purpose=treatment" || true)
  if [[ "$code" == "403" ]] && grep -q 'residency_denied' /tmp/chex-bootstrap-probe.json; then
    echo "bootstrap-opa-policy: ok (403 residency_denied)"
    exit 0
  fi
  sleep 2
done

echo "bootstrap-opa-policy: gateway probe failed (last code=${code:-none})" >&2
cat /tmp/chex-bootstrap-probe.json 2>/dev/null || true
exit 1
