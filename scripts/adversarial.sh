#!/usr/bin/env bash
# Tier-3 adversarial oracle — negative cases from specs/threat-model.yaml only.
# Cooperative flows live in ./scripts/demo.sh. Requires gateway stack (same as demo).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GW="${ADVERSARIAL_GW:-http://localhost:8081}"
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

if ! curl -fsS "$GW/health" >/dev/null 2>&1; then
  echo "Gateway not running. Start with: ./scripts/run-dev.sh" >&2
  exit 1
fi

# Adversarial tier needs intact patients — reset shred markers from prior demo runs.
if compgen -G "$ROOT/data/keys/*.shredded" >/dev/null; then
  rm -f "$ROOT"/data/keys/*.shredded
  docker compose -f "$ROOT/deploy/docker-compose.yml" restart gateway >/dev/null
  for _ in $(seq 1 30); do
    curl -fsS "$GW/health" >/dev/null 2>&1 && break
    sleep 2
  done
fi

wait_fhir() {
  local base="$1"
  for _ in $(seq 1 60); do
    if curl -fsS "${base}/metadata" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  echo "timeout waiting for FHIR server at ${base}" >&2
  return 1
}

log() { echo ""; echo "== adversarial: $* =="; }

log "Wait for EU HAPI (localhost:8080)"
wait_fhir "http://localhost:8080/fhir"

log "Load FHIR samples into EU HAPI"
for f in "$ROOT"/fhir/samples/eu/*.json; do
  id=$(basename "$f" .json)
  curl -fsS -X PUT "http://localhost:8080/fhir/Patient/${id}" \
    -H "Content-Type: application/fhir+json" \
    --data-binary @"$f" >/dev/null
done

log "Wait for US HAPI (localhost:8083)"
wait_fhir "http://localhost:8083/fhir"

log "Load FHIR samples into US HAPI"
for f in "$ROOT"/fhir/samples/us/*.json; do
  id=$(basename "$f" .json)
  curl -fsS -X PUT "http://localhost:8083/fhir/Patient/${id}" \
    -H "Content-Type: application/fhir+json" \
    --data-binary @"$f" >/dev/null
done

read_code() {
  local subject="$1" purpose="$2" auth="$3"
  curl -s -o /tmp/chex-adversarial.json -w "%{http_code}" \
    -H "Authorization: ${auth}" \
    "$GW/v1/patients/${subject}?purpose=${purpose}"
}

read_code_xp() {
  local subject="$1" purpose="$2" auth="$3" xp="$4"
  curl -s -o /tmp/chex-adversarial.json -w "%{http_code}" \
    -H "Authorization: ${auth}" \
    -H "X-TEFCA-XP: ${xp}" \
    "$GW/v1/patients/${subject}?purpose=${purpose}"
}

# deny_case: anonymous_eu_read
log "anonymous_eu_read (expect 401)"
code=$(curl -s -o /tmp/chex-adversarial.json -w "%{http_code}" \
  "$GW/v1/patients/patient-eu-001?purpose=treatment")
[[ "$code" == "401" ]]
echo "  ${code} (as expected)"

# deny_case: query_param_auth_bypass
log "query_param_auth_bypass (expect 401)"
code=$(curl -s -o /tmp/chex-adversarial.json -w "%{http_code}" \
  "$GW/v1/patients/patient-eu-001?purpose=treatment&requester_jurisdiction=us-clinician")
[[ "$code" == "401" ]]
echo "  ${code} (as expected)"

# deny_case: us_clinician_eu_treatment_deny
log "us_clinician_eu_treatment_deny (expect 403 residency_denied)"
code=$(read_code patient-eu-001 treatment "$US_CLINICIAN_AUTH")
if [[ "$code" != "403" ]]; then
  echo "  expected 403 got ${code}: $(cat /tmp/chex-adversarial.json)" >&2
  exit 1
fi
grep -q 'residency_denied' /tmp/chex-adversarial.json
echo "  ${code} (as expected)"

# deny_case: eu_visiting_us_home_deny
log "eu_visiting_us_home_deny (expect 403 residency_denied)"
code=$(read_code patient-us-001 treatment "$EU_VISITING_AUTH")
[[ "$code" == "403" ]]
grep -q 'residency_denied' /tmp/chex-adversarial.json
echo "  ${code} (as expected)"

# deny_case: ssraa_missing_us_read
log "ssraa_missing_us_read (expect 401 ssraa_required)"
code=$(curl -s -o /tmp/chex-adversarial.json -w "%{http_code}" \
  "$GW/v1/patients/patient-us-001?purpose=treatment")
[[ "$code" == "401" ]]
grep -q 'ssraa_required' /tmp/chex-adversarial.json
echo "  ${code} (as expected)"

# deny_case: ssraa_on_eu_patient_deny
log "ssraa_on_eu_patient_deny (expect 403 — US SSRAA must not read EU treatment)"
code=$(read_code patient-eu-001 treatment "$SSRA_AUTH")
[[ "$code" == "403" ]]
grep -q 'residency_denied' /tmp/chex-adversarial.json
echo "  ${code} (as expected)"

# deny_case: research_without_consent
log "research_without_consent (expect 403 consent_required)"
code=$(read_code patient-eu-001 research "$EU_HOME_AUTH")
[[ "$code" == "403" ]]
grep -q 'consent_required' /tmp/chex-adversarial.json
echo "  ${code} (as expected)"

# deny_case: research_revoked_deny — ensure research consent is false, then deny
log "research_revoked_deny (expect 403 consent_required after revoke)"
if [[ -z "${CHEX_ADMIN_SECRET:-}" ]]; then
  echo "CHEX_ADMIN_SECRET missing — run ./scripts/generate-opal-dev-secrets.sh and restart stack" >&2
  exit 1
fi
ADMIN_AUTH="Bearer ${CHEX_ADMIN_SECRET}"
curl -fsS -X POST -H "Authorization: ${ADMIN_AUTH}" \
  "$GW/v1/admin/consent?subject=patient-eu-002&action=revoke&purpose=research" >/dev/null
code=""
for _ in $(seq 1 20); do
  code=$(read_code patient-eu-002 research "$EU_HOME_AUTH")
  if [[ "$code" == "403" ]] && grep -q 'consent_required' /tmp/chex-adversarial.json; then
    break
  fi
  sleep 1
done
if [[ "$code" != "403" ]] || ! grep -q 'consent_required' /tmp/chex-adversarial.json; then
  echo "  expected 403 consent_required got ${code}: $(cat /tmp/chex-adversarial.json)" >&2
  exit 1
fi
echo "  ${code} (as expected)"

# deny_case: unknown_tefca_xp_deny
log "unknown_tefca_xp_deny (expect 403 xp_denied)"
code=$(read_code_xp patient-us-001 treatment "$SSRA_AUTH" "T-BOGUS")
[[ "$code" == "403" ]]
grep -q 'xp_denied' /tmp/chex-adversarial.json
echo "  ${code} (as expected)"

echo ""
echo "adversarial: ok — tier-3 deny cases passed"
