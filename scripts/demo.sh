#!/usr/bin/env bash
# End-to-end demo: intra-EU, US TEFCA secondary, cross-bloc deny/exception,
# consent deny, crypto-shred, AI oversight.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! curl -fsS http://localhost:8081/health >/dev/null 2>&1; then
  echo "Gateway not running. Start with: ./scripts/run-dev.sh" >&2
  exit 1
fi

# Prior demo runs leave shred markers on the workspace volume; reset for re-runs.
if compgen -G "$ROOT/data/keys/*.shredded" >/dev/null; then
  rm -f "$ROOT"/data/keys/*.shredded
  docker compose -f "$ROOT/deploy/docker-compose.yml" restart gateway >/dev/null
  for _ in $(seq 1 30); do
    curl -fsS http://localhost:8081/health >/dev/null 2>&1 && break
    sleep 2
  done
fi

log() { echo ""; echo "== $* =="; }

log "Load FHIR samples into EU HAPI (localhost:8080)"
for f in "$ROOT"/fhir/samples/eu/*.json; do
  id=$(basename "$f" .json)
  curl -fsS -X PUT "http://localhost:8080/fhir/Patient/${id}" \
    -H "Content-Type: application/fhir+json" \
    --data-binary @"$f" >/dev/null
  echo "  loaded $id (eu)"
done

log "Load FHIR samples into US HAPI (localhost:8083)"
for f in "$ROOT"/fhir/samples/us/*.json; do
  id=$(basename "$f" .json)
  curl -fsS -X PUT "http://localhost:8083/fhir/Patient/${id}" \
    -H "Content-Type: application/fhir+json" \
    --data-binary @"$f" >/dev/null
  echo "  loaded $id (us)"
done

log "1. Intra-EU treatment read (expect 200)"
curl -fsS "http://localhost:8081/v1/patients/patient-eu-001?purpose=treatment&requester_jurisdiction=eu-visiting" | tee /tmp/chex-demo-allow.json
grep -q '"patient"' /tmp/chex-demo-allow.json

log "2. Research without consent (expect 403)"
code=$(curl -s -o /tmp/chex-demo-deny.json -w "%{http_code}" \
  "http://localhost:8081/v1/patients/patient-eu-001?purpose=research&requester_jurisdiction=eu-home")
[[ "$code" == "403" ]]
grep -q 'policy_denied' /tmp/chex-demo-deny.json

log "3. Cross-bloc deny — EU requester to US home patient (expect 403 residency_denied)"
code=$(curl -s -o /tmp/chex-demo-cross-deny.json -w "%{http_code}" \
  "http://localhost:8081/v1/patients/patient-us-001?purpose=treatment&requester_jurisdiction=eu-visiting")
[[ "$code" == "403" ]]
grep -q 'residency_denied' /tmp/chex-demo-cross-deny.json

log "4. Cross-bloc derivative exception — US clinician to EU patient (expect 200, min fields)"
curl -fsS "http://localhost:8081/v1/patients/patient-eu-001?purpose=derivative&requester_jurisdiction=us-clinician&cross_bloc_permitted=true" \
  | tee /tmp/chex-demo-cross-exception.json
grep -q '"patient"' /tmp/chex-demo-cross-exception.json
grep -q 'resourceType' /tmp/chex-demo-cross-exception.json
python3 -c "
import json, sys
p = json.load(open('/tmp/chex-demo-cross-exception.json'))
fields = set(p.get('min_necessary_fields', []))
patient = p.get('patient', {})
assert fields == {'id', 'resourceType'}, fields
assert set(patient.keys()) <= {'id', 'resourceType'}, patient.keys()
"

log "5. US TEFCA secondary — intra-US treatment read (expect 200)"
curl -fsS "http://localhost:8081/v1/patients/patient-us-001?purpose=treatment&requester_jurisdiction=us-clinician" \
  | tee /tmp/chex-demo-us.json
grep -q '"patient"' /tmp/chex-demo-us.json
grep -q 'us-home' /tmp/chex-demo-us.json

log "6. Identity broker — TEFCA identifier resolve (expect 200)"
curl -fsS "http://localhost:8081/v1/identity/resolve?identifier=urn:tefca:patient:us-001" \
  | tee /tmp/chex-demo-broker.json
grep -q 'patient-us-001' /tmp/chex-demo-broker.json

log "7. AI triage with human oversight"
triage=$(curl -fsS -X POST http://localhost:8081/v1/ai/triage \
  -H "Content-Type: application/json" \
  -d '{"subject_pseudonym":"demo","features":{"age":55}}')
echo "$triage" | tee /tmp/chex-demo-ai.json
echo "$triage" | grep -q 'pending_human_oversight'
decision_id=$(python3 -c "import json,sys; print(json.load(sys.stdin)['decision_id'])" <<<"$triage")
curl -fsS -X POST "http://localhost:8082/v1/decisions/${decision_id}/approve" | grep -q approved

log "8. Tenant crypto-shred (expect subsequent EU reads 410 Gone)"
curl -fsS -X POST "http://localhost:8081/v1/admin/erasure/tenant?tenant=demo-tenant"
code=$(curl -s -o /dev/null -w "%{http_code}" \
  "http://localhost:8081/v1/patients/patient-eu-001?purpose=treatment&requester_jurisdiction=eu-visiting")
[[ "$code" == "410" ]]

log "demo: ok — intra-EU, US TEFCA, cross-bloc deny/exception, consent, AI, erasure evidenced"
echo "Audit sink: $ROOT/data/audit/eu.jsonl"
