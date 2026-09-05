# AGENTS.md — Cloud Healthcare Exchange

Community contract for humans and coding agents. This repo is a labelled
architecture sketch of a **federated HIE**: EU/US **jurisdiction cells**,
**OPAL consent**, OPA policy-as-code, and FHIR R4. It is not a production
exchange and not a Medplum/HAPI replacement.

Factory/corporate site overlay (handoffs, digest boundary, never self-approve)
lives in [docs/factory-overlay.md](docs/factory-overlay.md). Start here.

There are no `services/*/AGENTS.md` files; this file is the contract for
gateway, consent-service, identity-broker, and ai-governance.

## Never do

- **No real PHI.** `fhir/samples/` is synthetic. Do not load production patient data into issues, PRs, demos, or Compose.
- **No query-param jurisdiction.** Patient-read authorization must come from **verified per-cell caller credentials** (EU auth + US SSRAA stub via the principal abstraction). Never honor `requester_jurisdiction` (or similar) as identity.
- Never read or print `.env` contents, `deploy/opal/dev-secrets.env`, or OPAL keys.
- Do not invent a policy-sync mechanism. After `policy/*.rego` edits, run the existing `./scripts/sync-policy-repo.sh` before `./scripts/demo.sh` or claiming OPAL policy is current.
- Do not claim FedRAMP/GDPR certification, an ATO, or production hardening.

## Commands

| Command | Purpose |
|---------|---------|
| `./scripts/verify.sh` | Definition of Done (hermetic: harness + go + python×3 + opa) |
| `./scripts/run-dev.sh` | Start EU + US cells + OPAL (`--down-first` to recycle) |
| `./scripts/teardown-dev.sh` | Stop compose stack (`--volumes` to drop DB volumes) |
| `./scripts/demo.sh` | Cooperative E2E (Compose must be up) |
| `./scripts/adversarial.sh` | Tier-3 adversarial oracle (auth/residency denies) |
| `./scripts/sync-policy-repo.sh` | Mirror `policy/*.rego` to healthcare-policy (existing script) |
| `./scripts/check-portfolio.sh` | Portfolio contract + policy-mirror drift |
| `./scripts/check-harness.sh` | Validate multi-repo harness + corp-site overlay |
| `cd web && npm run verify` | Web UI typecheck + build + smoke + axe |

## Definition of Done

```bash
./scripts/verify.sh
./scripts/demo.sh            # cooperative tier — stack up
./scripts/adversarial.sh     # tier-3 denies — after demo or standalone when stack up
cd web && npm run verify   # optional: clinician console (requires gateway for live API)
```

`verify.sh` is hermetic (no Docker) and gates the agent stop hook. Do **not**
cite it alone as proof of cross-bloc or demo scenarios. Compose E2E is
`./scripts/demo.sh` plus `./scripts/adversarial.sh` (CI: `demo-e2e`). Threat
model: `docs/adr/0000-threat-model.md` + `specs/threat-model.yaml`.

## Layout

| Path | Purpose |
|------|---------|
| `services/gateway/` | Go jurisdiction router + OPA PEP + identity broker + consent proxy |
| `services/consent-service/` | Python FastAPI consent state + OPAL data source (ADR 0008) |
| `services/identity-broker/` | Python FastAPI ITI-78 identifier resolve (ADR 0010) |
| `services/ai-governance/` | Python FastAPI AI governance stub |
| `policy/` | Canonical OPA Rego + tests (consent from `data.consent`) |
| `config/` | Routing, identity registry, OPAL hardening, EU auth, SSRAA |
| `deploy/docker-compose.yml` | EU + US cells + OPAL (server/client/broadcast) |
| `fhir/samples/` | Synthetic Patient resources (`eu/`, `us/`) |
| `web/` | Next.js clinician console (BFF → gateway :8081) |
| `docs/` | Mandate, architecture, ADRs, roadmap |
| `specs/portfolio.yaml` | Multi-repo contract (canonical + healthcare-policy) |
| `.harness/` | Multi-repo harness (solo profile + policy-sync-stamp) — keep live |

## Domain gotchas

- Consent decisions read **`data.consent`** published by OPAL, not a static request field.
- This repo is the **canonical** policy tree. [healthcare-policy](https://github.com/SafetyMP/healthcare-policy) is a mirror only — do not edit it by hand; use `./scripts/sync-policy-repo.sh`.
- Do not archive or remove `.harness/`.
- First `./scripts/verify.sh` may create Python `.venv` dirs under the services and download OPA to `.tools/bin/`.
- `./scripts/run-dev.sh` then `./scripts/demo.sh`: HAPI JVM boot can take 2+ minutes per cell. First `run-dev.sh` writes gitignored OPAL secrets under `deploy/opal/`.
- Smallest correct diff; match existing conventions in each service.

## Coding rules

- Smallest correct diff; match existing conventions.
- Never read or print `.env` contents.
- Reopen parallel factory work via `proceed` + refreshed `specs/MANDATE.md` before fleet tracks. See [docs/factory-overlay.md](docs/factory-overlay.md).

## Cursor Cloud specific instructions

- **Hermetic verify:** `./scripts/verify.sh` installs a Python `.venv` under `services/ai-governance/` and downloads OPA to `.tools/bin/` on first run.
- **Docker demo:** `./scripts/run-dev.sh` then `./scripts/demo.sh` — HAPI JVM boot can take 2+ minutes per cell.
- Hooks: `python3 .cursor/hooks/<hook>.py < payload.json` — avoid blocked patterns on the shell command line when testing guards.
