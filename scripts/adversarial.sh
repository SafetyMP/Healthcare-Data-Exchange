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

log() { echo ""; echo "== adversarial: $* =="; }

read_code() {
  local subject="$1" purpose="$2" auth="$3"
  curl -s -o /tmp/chex-adversarial.json -w "%{http_code}" \
    -H "Authorization: ${auth}" \
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
[[ "$code" == "403" ]]
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

echo ""
echo "adversarial: ok — tier-3 deny cases passed"
