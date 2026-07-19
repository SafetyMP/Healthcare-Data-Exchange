#!/usr/bin/env bash
# Validate harness scaffold (structure + hook syntax).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

errors=0
PROFILE="$(grep '^profile:' .harness/profile.yaml 2>/dev/null | awk '{print $2}' || echo solo)"

require_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "MISSING: $path" >&2
    errors=$((errors + 1))
  fi
}

echo "== harness: contract (profile=$PROFILE) =="
require_file ".harness/profile.yaml"
require_file ".harness/VERSION"
require_file "AGENTS.md"
require_file "scripts/verify.sh"
require_file ".cursor/hooks.json"
require_file "specs/portfolio.yaml"
require_file ".corp-harness/site.json"
require_file ".corp-harness/component-contracts.json"
require_file ".cursor/rules/site-contract.mdc"
require_file ".cursor/skills/site-delivery/SKILL.md"

echo "== harness: corp-site overlay =="
python3 -c "
import json, sys
p = json.load(open('.corp-harness/site.json'))
assert p.get('schema') == 'corporate-site-site/v1', p.get('schema')
assert p.get('site_id') == 'healthcare-exchange', p.get('site_id')
assert p.get('verify_argv') == ['./scripts/verify.sh'], p.get('verify_argv')
assert p.get('adversarial_argv') == ['./scripts/adversarial.sh'], p.get('adversarial_argv')
# Unbound until a corporate handoff is bound; keep fields consistent.
prog, handoff = p.get('corporate_program'), p.get('corporate_handoff_sha256')
if prog is None:
    assert handoff is None, 'unbound site must have null corporate_handoff_sha256'
    assert p.get('binding_status', 'unbound') == 'unbound', p.get('binding_status')
else:
    assert isinstance(handoff, str) and len(handoff) == 64, 'bound site needs handoff sha256'
    assert p.get('binding_status') == 'bound', p.get('binding_status')
print('corp-site site.json: ok')

c = json.load(open('.corp-harness/component-contracts.json'))
assert c.get('schema') == 'corporate-site-component-contracts/v1', c.get('schema')
shared = c.get('shared_components') or {}
for role in ('operations-excellence', 'site-delivery', 'site-manager', 'site-specialist'):
    assert role in shared, f'missing shared_components.{role}'
ops = shared['operations-excellence']
assert ops.get('authority') == 'review-only'
assert ops.get('may_approve') is False
assert ops.get('readonly') is True
mgr = shared['site-manager']
assert mgr.get('authority') == 'decompose-only'
assert mgr.get('may_approve') is False
assert mgr.get('readonly') is True
spec = shared['site-specialist']
assert spec.get('authority') == 'adr-bounded-write'
assert spec.get('may_approve') is False
assert spec.get('may_delegate') is False
delivery = shared['site-delivery']
assert delivery.get('dispatch_owner') == 'root-orchestrator'
assert delivery.get('workers_may_delegate') is False
print('corp-site component-contracts: ok')
" || errors=$((errors + 1))

if [[ "$PROFILE" == "fleet" ]]; then
  require_file "specs/MANDATE.md"
fi

echo "== harness: vendored hooks =="
HOOKS=(
  _common.py guard-shell.py guard-mcp.py guard-network.py protect-secrets.py
  scan-prompt.py verify-on-stop.py
)
if [[ "$PROFILE" == "fleet" ]]; then
  HOOKS+=(
    guard-instruction.py session-mode.py session-start.py subagent-handoff.py
  )
fi
for hook in "${HOOKS[@]}"; do
  require_file ".cursor/hooks/$hook"
done

echo "== harness: profile spot-check =="
if ! grep -q "profile: $PROFILE" .harness/profile.yaml; then
  echo "BAD PROFILE: expected $PROFILE in .harness/profile.yaml" >&2
  errors=$((errors + 1))
fi
if ! grep -q 'harness-contract/v1' .harness/profile.yaml; then
  echo "BAD SCHEMA: .harness/profile.yaml" >&2
  errors=$((errors + 1))
fi
if [[ "$PROFILE" == "fleet" ]] && ! grep -qE '^Status:[[:space:]]*ACTIVE' specs/MANDATE.md; then
  echo "BAD MANDATE: specs/MANDATE.md must have Status: ACTIVE for fleet" >&2
  errors=$((errors + 1))
fi

echo "== harness: hooks.json =="
python3 -c "import json; json.load(open('.cursor/hooks.json'))"

echo "== harness: python syntax =="
PY_FILES=(.cursor/hooks/_common.py .cursor/hooks/guard-shell.py .cursor/hooks/guard-mcp.py
  .cursor/hooks/guard-network.py .cursor/hooks/protect-secrets.py .cursor/hooks/scan-prompt.py
  .cursor/hooks/verify-on-stop.py)
if [[ "$PROFILE" == "fleet" ]]; then
  PY_FILES+=(
    .cursor/hooks/guard-instruction.py .cursor/hooks/session-mode.py
    .cursor/hooks/session-start.py .cursor/hooks/subagent-handoff.py
  )
fi
python3 -m py_compile "${PY_FILES[@]}"

echo "== harness: stub canary =="
if [[ -x "$ROOT/scripts/check-stub-canary.sh" ]]; then
  "$ROOT/scripts/check-stub-canary.sh"
else
  echo "MISSING: scripts/check-stub-canary.sh" >&2
  errors=$((errors + 1))
fi

echo "== harness: threat model tier =="
if [[ -x "$ROOT/scripts/check-threat-model.sh" ]]; then
  "$ROOT/scripts/check-threat-model.sh"
else
  echo "MISSING: scripts/check-threat-model.sh" >&2
  errors=$((errors + 1))
fi

if [[ "$errors" -gt 0 ]]; then
  echo "check-harness: FAILED ($errors errors)" >&2
  exit 1
fi

echo "check-harness: ok"
