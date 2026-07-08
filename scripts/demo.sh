#!/usr/bin/env bash
# End-to-end demo: intra-EU, US TEFCA secondary, cross-bloc deny/exception,
# dynamic consent revocation via OPAL (ADR 0008), crypto-shred, AI oversight.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GW="http://localhost:8081"

if ! curl -fsS "$GW/health" >/dev/null 2>&1; then
  echo "Gateway not running. Start with: ./scripts/run-dev.sh" >&2
  exit 1
fi

# Prior demo runs leave shred markers on the workspace volume; reset for re-runs.
if compgen -G "$ROOT/data/keys/*.shredded" >/dev/null; then
  rm -f "$ROOT"/data/keys/*.shredded
  docker compose -f "$ROOT/deploy/docker-compose.yml" restart gateway >/dev/null
  for _ in $(seq 1 30); do
    curl -fsS "$GW/health" >/dev/null 2>&1 && break
    sleep 2
  done
fi

log() { echo ""; echo "== $* =="; }

# read_code SUBJECT PURPOSE JURISDICTION [extra-query] -> echoes HTTP status, body to /tmp/chex-read.json
read_code() {
  local subject="$1" purpose="$2" juris="$3" extra="${4:-}"
  curl -s -o /tmp/chex-read.json -w "%{http_code}" \
    "$GW/v1/patients/${subject}?purpose=${purpose}&requester_jurisdiction=${juris}${extra}"
}

# wait_for_code SUBJECT PURPOSE JURISDICTION EXPECTED -> polls until status matches (OPAL propagation)
wait_for_code() {
  local subject="$1" purpose="$2" juris="$3" want="$4"
  for _ in $(seq 1 20); do
    local code
    code=$(read_code "$subject" "$purpose" "$juris")
    if [[ "$code" == "$want" ]]; then
      return 0
    fi
    sleep 1
  done
  echo "timeout waiting for $subject/$purpose -> $want (last=$code)" >&2
  return 1
}

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

log "Ensure OPAL has synced consent data (research read reflects consent)"
# patient-eu-002 seeds with research consent granted; wait until PDP reflects it.
if ! curl -fsS -X POST "$GW/v1/admin/consent?subject=patient-eu-002&action=grant&purpose=research" >/dev/null; then
  echo "consent grant call failed" >&2; exit 1
fi
wait_for_code patient-eu-002 research eu-home 200

log "1. Intra-EU treatment read (expect 200)"
curl -fsS "$GW/v1/patients/patient-eu-001?purpose=treatment&requester_jurisdiction=eu-visiting" | tee /tmp/chex-demo-allow.json
grep -q '"patient"' /tmp/chex-demo-allow.json

log "2. Research without consent — patient-eu-001 (expect 403)"
code=$(read_code patient-eu-001 research eu-home)
[[ "$code" == "403" ]]
grep -q 'policy_denied' /tmp/chex-read.json
echo "  403 consent_required (as expected)"

log "3. Cross-bloc deny — EU requester to US home patient (expect 403 residency_denied)"
code=$(read_code patient-us-001 treatment eu-visiting)
[[ "$code" == "403" ]]
grep -q 'residency_denied' /tmp/chex-read.json
echo "  403 residency_denied (as expected)"

log "4. Cross-bloc derivative exception — US clinician to EU patient (expect 200, min fields)"
curl -fsS "$GW/v1/patients/patient-eu-001?purpose=derivative&requester_jurisdiction=us-clinician&cross_bloc_permitted=true" \
  | tee /tmp/chex-demo-cross-exception.json
python3 -c "
import json
p = json.load(open('/tmp/chex-demo-cross-exception.json'))
fields = set(p.get('min_necessary_fields', []))
patient = p.get('patient', {})
assert fields == {'id', 'resourceType'}, fields
assert set(patient.keys()) <= {'id', 'resourceType'}, patient.keys()
"

log "5. US TEFCA secondary — intra-US treatment read (expect 200)"
curl -fsS "$GW/v1/patients/patient-us-001?purpose=treatment&requester_jurisdiction=us-clinician" \
  | tee /tmp/chex-demo-us.json
grep -q 'us-home' /tmp/chex-demo-us.json

log "6. Identity broker — TEFCA identifier resolve (expect 200)"
curl -fsS "$GW/v1/identity/resolve?identifier=urn:tefca:patient:us-001" | tee /tmp/chex-demo-broker.json
grep -q 'patient-us-001' /tmp/chex-demo-broker.json

log "7. Dynamic consent — patient-eu-002 research allowed now (expect 200)"
code=$(read_code patient-eu-002 research eu-home)
[[ "$code" == "200" ]]
echo "  200 (consent active)"

log "7a. REVOKE consent via gateway -> OPAL sync -> research denied (expect 403, no restart)"
curl -fsS -X POST "$GW/v1/admin/consent?subject=patient-eu-002&action=revoke&purpose=research" | tee /tmp/chex-consent.json
wait_for_code patient-eu-002 research eu-home 403
echo "  403 consent_required after live revocation"

log "7b. GRANT consent again -> research allowed (expect 200, no restart)"
curl -fsS -X POST "$GW/v1/admin/consent?subject=patient-eu-002&action=grant&purpose=research" >/dev/null
wait_for_code patient-eu-002 research eu-home 200
echo "  200 after live re-grant"

log "8. AI triage with human oversight"
triage=$(curl -fsS -X POST "$GW/v1/ai/triage" \
  -H "Content-Type: application/json" \
  -d '{"subject_pseudonym":"demo","features":{"age":55}}')
echo "$triage" | tee /tmp/chex-demo-ai.json
echo "$triage" | grep -q 'pending_human_oversight'
decision_id=$(python3 -c "import json,sys; print(json.load(sys.stdin)['decision_id'])" <<<"$triage")
curl -fsS -X POST "http://localhost:8082/v1/decisions/${decision_id}/approve" | grep -q approved

log "9. Tenant crypto-shred (expect subsequent EU reads 410 Gone)"
curl -fsS -X POST "$GW/v1/admin/erasure/tenant?tenant=demo-tenant"
code=$(read_code patient-eu-001 treatment eu-visiting)
[[ "$code" == "410" ]]

log "demo: ok — intra-EU, US TEFCA, cross-bloc deny/exception, DYNAMIC consent revoke/grant, AI, erasure"
echo "Audit sink: $ROOT/data/audit/eu.jsonl"
