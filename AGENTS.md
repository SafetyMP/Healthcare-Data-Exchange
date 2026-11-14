# AGENTS.md — Healthcare Data Exchange

Healthcare Data Exchange is a guided synthetic demonstration of how consent,
requesting teams, and regional boundaries affect patient access. The published
GitHub Pages experience runs locally in the browser. A separate backend reference
uses HAPI FHIR EU/US cells, OPA, and OPAL. Neither mode is a production exchange,
a clinical record system, or a replacement for Medplum or HAPI FHIR.

Start with the user's current scope and this contract. Read the
[agent guide](docs/agent-guide.md) for task-specific files, setup, routes, and checks;
read the [factory overlay](docs/factory-overlay.md) for applicable corporate/site
handoff and digest boundaries. This root contract also covers all four services;
there are no `services/*/AGENTS.md` files.

## Boundaries

- **Synthetic data only.** No real PHI in code, forms, issues, PRs, logs, demos, or Compose.
- **Caller identity comes from verified credentials.** Never authorize live patient
  reads using `requester_jurisdiction`, a URL preset, or another caller-supplied
  jurisdiction. Browser requester presets are demonstration context, not proof of identity.
- Never read or print `.env` contents, `deploy/opal/dev-secrets.env`, or OPAL keys.
  Never persist live bearer/admin tokens in URLs, browser storage, logs, or public assets.
- Live consent is `data.consent` published through OPAL. Browser session consent
  is simulation only; never substitute it for a failed live request.
- This repository owns canonical `policy/*.rego`. After policy edits, use the
  existing `./scripts/sync-policy-repo.sh` before `./scripts/demo.sh` or claiming
  OPAL policy is current. Do not edit the `healthcare-policy` mirror by hand or
  invent another synchronization path.
- Do not claim certification, FedRAMP/GDPR compliance certification, an ATO,
  production hardening, clinical validity, or live policy proof from frontend tests.
- Preserve `.harness/`, `.corp-harness/`, archived evidence, and stopped work.
  Never edit corporate approval state or self-approve. Read
  [the current mandate](specs/MANDATE.md) before parallel implementation; historical
  phase-3 fleet work remains halted. Reopening that work requires explicit user
  authorization (`proceed`) and a refreshed mandate; new frontend work does not reactivate it.

## Commands and evidence

Run web commands from `web/` with Node 22 and npm 10.9.2–10.x after `npm ci`.
Install the test browser once with `npx playwright install chromium`.

| Task | Command | Evidence boundary |
|---|---|---|
| Preview the static demo | `npm run build:demo && npm run preview:demo` | Browser simulation at `/Healthcare-Data-Exchange/` |
| Check the static demo | `npm run verify:demo` | Unit, typecheck, export, browser flows and accessibility |
| Check gateway-mode web UI | `npm run verify` | Typecheck, build, smoke and accessibility; not backend E2E |
| Repository Definition of Done | `./scripts/verify.sh` from root | Hermetic harness, Go, Python and OPA checks; no Docker |
| Backend runtime proof | `./scripts/demo.sh` then `./scripts/adversarial.sh` from root | Requires the running Compose stack |

`verify.sh` remains the repository Definition of Done and stop-hook gate. Do not
cite it alone as cross-region or live-consent runtime proof. Backend/auth/policy
changes also need the runtime gates above; see the guide for startup, teardown,
policy, and portfolio commands. Preserve required CI and branch protections.

## Source map and conventions

- `web/src/app/`: task routes; `web/src/components/walkthrough/` and
  `web/src/lib/walkthrough.ts`: guided checkpoints.
- `web/src/lib/demo.ts`: synthetic fixtures and simulation;
  `web/src/lib/api.ts`: explicit demo/live routing and live request contracts.
- `services/`, `policy/`, `config/`, `fhir/`, `deploy/`: backend reference,
  policy, routing, synthetic FHIR fixtures, and Compose.
- `docs/`: current product guidance plus architecture/ADRs and retained evidence;
  `specs/portfolio.yaml`: canonical repository and policy-mirror contract.

Keep changes scoped and match the existing stack and conventions. Follow
[path-specific standards](.github/instructions/) and
[Copilot instructions](.github/copilot-instructions.md); use the
[repository review guidance](.github/skills/code-review/SKILL.md) for review.
Report implementation, local checks, remote CI, and published behavior separately.
