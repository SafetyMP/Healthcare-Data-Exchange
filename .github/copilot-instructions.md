# Copilot instructions — Cloud Healthcare Exchange

Architecture sketch of a federated HIE: EU/US jurisdiction cells, OPAL consent,
OPA policy-as-code, FHIR R4. Not a Medplum/HAPI replacement. Not a production exchange.

## Verify

- Day-to-day done: `./scripts/verify.sh` (hermetic).
- Runtime proof: `./scripts/demo.sh` and `./scripts/adversarial.sh` with Compose up.
- Do not cite `verify.sh` alone as cross-bloc or consent-live evidence.

## Never do

- No real PHI. `fhir/samples/` is synthetic.
- Do not set requester jurisdiction from query parameters. Use verified per-cell credentials.
- Do not invent a policy-sync path. After `policy/*.rego`, run existing `./scripts/sync-policy-repo.sh`.
- Do not claim certification, an ATO, or production hardening.

Read [AGENTS.md](../AGENTS.md) before editing. Factory overlay: [docs/factory-overlay.md](../docs/factory-overlay.md).
Security: [SECURITY.md](../SECURITY.md) and https://github.com/SafetyMP/Healthcare-Data-Exchange/security/advisories/new
