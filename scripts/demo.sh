#!/usr/bin/env bash
# End-to-end demo: intra-EU access, consent deny, crypto-shred, AI oversight.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! curl -fsS http://localhost:8081/health >/dev/null 2>&1; then
  echo "Gateway not running. Start with: ./scripts/run-dev.sh" >&2
  exit 1
fi

log() { echo ""; echo "== $* =="; }

log "Load FHIR samples into HAPI"
for f in "$ROOT"/fhir/samples/eu/*.json; do
  id=$(basename "$f" .json)
  curl -fsS -X PUT "http://localhost:8080/fhir/Patient/${id}" \
    -H "Content-Type: application/fhir+json" \
    --data-binary @"$f" >/dev/null
  echo "  loaded $id"
done

log "1. Intra-EU treatment read (expect 200)"
curl -fsS "http://localhost:8081/v1/patients/patient-eu-001?purpose=treatment&requester_jurisdiction=eu-visiting" | tee /tmp/chex-demo-allow.json
grep -q '"patient"' /tmp/chex-demo-allow.json

log "2. Research without consent (expect 403)"
code=$(curl -s -o /tmp/chex-demo-deny.json -w "%{http_code}" \
  "http://localhost:8081/v1/patients/patient-eu-001?purpose=research&requester_jurisdiction=eu-home")
[[ "$code" == "403" ]]
grep -q 'policy_denied' /tmp/chex-demo-deny.json

log "3. AI triage with human oversight"
triage=$(curl -fsS -X POST http://localhost:8081/v1/ai/triage \
  -H "Content-Type: application/json" \
  -d '{"subject_pseudonym":"demo","features":{"age":55}}')
echo "$triage" | tee /tmp/chex-demo-ai.json
echo "$triage" | grep -q 'pending_human_oversight'
decision_id=$(python3 -c "import json,sys; print(json.load(sys.stdin)['decision_id'])" <<<"$triage")
curl -fsS -X POST "http://localhost:8082/v1/decisions/${decision_id}/approve" | grep -q approved

log "4. Tenant crypto-shred (expect subsequent reads 410 Gone)"
curl -fsS -X POST "http://localhost:8081/v1/admin/erasure/tenant?tenant=demo-tenant"
code=$(curl -s -o /dev/null -w "%{http_code}" \
  "http://localhost:8081/v1/patients/patient-eu-001?purpose=treatment&requester_jurisdiction=eu-visiting")
[[ "$code" == "410" ]]

log "demo: ok — residency/consent/AI-oversight/erasure evidenced"
echo "Audit sink: $ROOT/data/audit/eu.jsonl"
