# Copilot instructions

Healthcare Data Exchange is a guided synthetic demonstration of consent,
requesting teams, and regional patient-access boundaries. GitHub Pages runs a
browser-local simulation. The separate backend reference uses HAPI FHIR EU/US
cells, OPA, OPAL, and credential-based gateway access. Neither mode is a production
exchange, clinical record system, or a Medplum/HAPI replacement.

Read [AGENTS.md](../AGENTS.md) first, then the relevant sections of the
[agent guide](../docs/agent-guide.md). Preserve applicable
[factory-overlay](../docs/factory-overlay.md) authority/digest boundaries and
[mandate](../specs/MANDATE.md) holds; never self-approve or reactivate historical work.

## Verify the changed behavior

- Static demo: `cd web && npm run verify:demo` (unit, typecheck, export, browser/accessibility checks).
- Gateway-mode UI: `cd web && npm run verify`; its smoke checks are not backend runtime proof.
- Repository Definition of Done: `./scripts/verify.sh` (hermetic).
- Backend runtime proof: `./scripts/demo.sh` and `./scripts/adversarial.sh` with Compose up.
- Record local, remote CI, deployment, and live checks separately. Do not cite browser
  simulation or hermetic verify as live cross-region or OPAL-consent evidence.

## Preserve the boundaries

- No real PHI. Fixtures, public demos, tests, and submitted examples remain synthetic.
- No query-parameter authorization: live requester jurisdiction comes from verified
  per-cell credentials. URL requester presets are navigation context only.
- Never read/print `.env`, OPAL development secrets, or keys; never persist live bearer/admin
  tokens in URLs, browser storage, logs, or exported assets.
- Keep browser simulation explicit. Do not use fixtures as a fallback for a failed gateway.
- Live consent is OPAL's `data.consent`. After `policy/*.rego` changes, use the existing
  `./scripts/sync-policy-repo.sh` before the runtime demo or claiming policy is current.
  Do not edit the mirror by hand or invent another sync mechanism.
- Preserve `.harness/`, `.corp-harness/`, historical evidence, approval state, and stopped work.
- No certification, ATO, production-hardening, clinical-validity, or guaranteed-discovery claims.

Follow the [path-specific standards](instructions/) and
[repository code-review guidance](skills/code-review/SKILL.md). Keep changes scoped
and retain the existing stack. Security reporting is described in
[SECURITY.md](../SECURITY.md) and the repository's
[private advisory form](https://github.com/SafetyMP/Healthcare-Data-Exchange/security/advisories/new).
