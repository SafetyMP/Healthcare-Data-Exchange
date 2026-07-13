#!/usr/bin/env bash
# End-to-end demo: intra-EU, US TEFCA secondary, cross-bloc deny/exception,
# dynamic consent revocation via OPAL (ADR 0008), crypto-shred, AI oversight.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GW="http://localhost:8081"
EU_HOME_AUTH="Bearer eu-home-client.demo-eu-home-secret"
EU_VISITING_AUTH="Bearer eu-visiting-client.demo-eu-visiting-secret"
US_CLINICIAN_AUTH="Bearer us-clinician-client.demo-us-clinician-secret"
SSRA_AUTH="Bearer tefca-demo-client.demo-ssraa-secret"

if [[ -f "$ROOT/deploy/opal/dev-secrets.env" ]]; then
  # shellcheck disable=SC1091
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/deploy/opal/dev-secrets.env"
  set +a
fi
if [[ -z "${CHEX_ADMIN_SECRET:-}" ]]; then
  echo "CHEX_ADMIN_SECRET missing — run ./scripts/generate-opal-dev-secrets.sh and restart stack" >&2
  exit 1
fi
ADMIN_AUTH="Bearer ${CHEX_ADMIN_SECRET}"

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

# read_code SUBJECT PURPOSE AUTH_HEADER -> echoes HTTP status, body to /tmp/chex-read.json
read_code() {
  local subject="$1" purpose="$2" auth="$3"
  curl -s -o /tmp/chex-read.json -w "%{http_code}" \
    -H "Authorization: ${auth}" \
    "$GW/v1/patients/${subject}?purpose=${purpose}"
}

# wait_for_code SUBJECT PURPOSE AUTH EXPECTED -> polls until status matches (OPAL propagation)
wait_for_code() {
  local subject="$1" purpose="$2" auth="$3" want="$4"
  for _ in $(seq 1 20); do
    local code
    code=$(read_code "$subject" "$purpose" "$auth")
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
if ! curl -fsS -X POST -H "Authorization: ${ADMIN_AUTH}" \
  "$GW/v1/admin/consent?subject=patient-eu-002&action=grant&purpose=research" >/dev/null; then
  echo "consent grant call failed" >&2; exit 1
fi
wait_for_code patient-eu-002 research "$EU_HOME_AUTH" 200

if [[ "${CHEX_OPAL_SECURE:-0}" == "1" ]]; then
  log "0. OPAL secure mode — unauthenticated publish denied (expect 401/403)"
  code=$(curl -s -o /tmp/chex-opal-unauth.json -w "%{http_code}" \
    -X POST "http://localhost:7002/data/config" \
    -H "Content-Type: application/json" \
    -d '{"entries":[]}')
  [[ "$code" == "401" || "$code" == "403" ]]
  echo "  ${code} (as expected)"

  log "0b. Policy bundle hash matches canonical stamp"
  "$ROOT/scripts/check-policy-bundle.sh"
fi

log "1. Intra-EU treatment read (expect 200)"
curl -fsS -H "Authorization: ${EU_VISITING_AUTH}" \
  "$GW/v1/patients/patient-eu-001?purpose=treatment" | tee /tmp/chex-demo-allow.json
grep -q '"patient"' /tmp/chex-demo-allow.json

log "2. Research without consent — patient-eu-001 (expect 403)"
code=$(read_code patient-eu-001 research "$EU_HOME_AUTH")
[[ "$code" == "403" ]]
grep -q 'policy_denied' /tmp/chex-read.json
echo "  403 consent_required (as expected)"

log "3. Cross-bloc deny — EU requester to US home patient (expect 403 residency_denied)"
code=$(read_code patient-us-001 treatment "$EU_VISITING_AUTH")
[[ "$code" == "403" ]]
grep -q 'residency_denied' /tmp/chex-read.json
echo "  403 residency_denied (as expected)"

log "4. Cross-bloc derivative exception — US clinician to EU patient (expect 200, min fields)"
curl -fsS -H "Authorization: ${US_CLINICIAN_AUTH}" \
  "$GW/v1/patients/patient-eu-001?purpose=derivative" \
  | tee /tmp/chex-demo-cross-exception.json
python3 -c "
import json
p = json.load(open('/tmp/chex-demo-cross-exception.json'))
fields = set(p.get('min_necessary_fields', []))
patient = p.get('patient', {})
assert fields == {'id', 'resourceType'}, fields
assert set(patient.keys()) <= {'id', 'resourceType'}, patient.keys()
"

log "5a. Patient read without SSRAA association (expect 401)"
code=$(curl -s -o /tmp/chex-demo-ssraa-deny.json -w "%{http_code}" \
  "$GW/v1/patients/patient-us-001?purpose=treatment")
[[ "$code" == "401" ]]
grep -q 'ssraa_required' /tmp/chex-demo-ssraa-deny.json
echo "  401 ssraa_required (as expected)"

log "5. US TEFCA secondary — intra-US treatment read with SSRAA (expect 200)"
curl -fsS -H "Authorization: $SSRA_AUTH" \
  "$GW/v1/patients/patient-us-001?purpose=treatment" \
  | tee /tmp/chex-demo-us.json
grep -q 'us-home' /tmp/chex-demo-us.json

log "6a. Identity broker service — direct ITI-78 resolve (expect 200)"
curl -fsS "http://localhost:8085/v1/resolve?identifier=urn:tefca:patient:us-001" | tee /tmp/chex-demo-broker-svc.json
grep -q 'patient-us-001' /tmp/chex-demo-broker-svc.json

log "6. Identity broker via gateway (expect 200)"
curl -fsS "$GW/v1/identity/resolve?identifier=urn:tefca:patient:us-001" | tee /tmp/chex-demo-broker.json
grep -q 'patient-us-001' /tmp/chex-demo-broker.json

log "6b. Register EU-002 identifier on broker; gateway patient read by identifier only (expect 200)"
curl -fsS -X POST "http://localhost:8085/v1/identifiers" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"urn:ehds:patient:eu-002","subject":"patient-eu-002","home_jurisdiction":"eu-home"}' \
  >/dev/null
curl -fsS -H "Authorization: ${EU_HOME_AUTH}" \
  "$GW/v1/patients/_?identifier=urn:ehds:patient:eu-002&purpose=research" \
  | tee /tmp/chex-demo-broker-read.json
grep -q 'patient-eu-002' /tmp/chex-demo-broker-read.json

log "7. Dynamic consent — patient-eu-002 research allowed now (expect 200)"
code=$(read_code patient-eu-002 research "$EU_HOME_AUTH")
[[ "$code" == "200" ]]
echo "  200 (consent active)"

log "7a. REVOKE consent via gateway -> OPAL sync -> research denied (expect 403, no restart)"
curl -fsS -X POST -H "Authorization: ${ADMIN_AUTH}" \
  "$GW/v1/admin/consent?subject=patient-eu-002&action=revoke&purpose=research" | tee /tmp/chex-consent.json
wait_for_code patient-eu-002 research "$EU_HOME_AUTH" 403
echo "  403 consent_required after live revocation"

log "7b. GRANT consent again -> research allowed (expect 200, no restart)"
curl -fsS -X POST -H "Authorization: ${ADMIN_AUTH}" \
  "$GW/v1/admin/consent?subject=patient-eu-002&action=grant&purpose=research" >/dev/null
wait_for_code patient-eu-002 research "$EU_HOME_AUTH" 200
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
curl -fsS -X POST -H "Authorization: ${ADMIN_AUTH}" \
  "$GW/v1/admin/erasure/tenant?tenant=demo-tenant"
code=$(read_code patient-eu-001 treatment "$EU_VISITING_AUTH")
[[ "$code" == "410" ]]

log "demo: ok — intra-EU, US TEFCA, cross-bloc deny/exception, identity broker, DYNAMIC consent revoke/grant, AI, erasure"
echo "Audit sink: $ROOT/data/audit/eu.jsonl"
