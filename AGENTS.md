# AGENTS.md — Cloud Healthcare Exchange

Corporate/site overlay (`site_id: healthcare-exchange`) plus **multi-repo harness**
(`.harness/`) for policy sync with healthcare-policy. Do not archive or remove `.harness/`.

Prior Cursor Harness v4 AGENTS snapshot: `_archives/harness-v4/`. Live control plane for
corp-site delivery is `.corp-harness/` + site agents/skills/rules.

## Gates

| Command | Purpose |
|---|---|
| `./scripts/verify.sh` | Functional and static acceptance |
| `./scripts/adversarial.sh` | Tier-3 adversarial oracle (auth/residency denies) |

The corporate handoff fixes scope for corp-site delivery. The site manager assigns ADRs;
site specialists write; operations excellence reviews immutable root-produced evidence.
Never edit corporate approval state or self-approve.

## Multi-repo harness (kept live)

This repo is the **canonical** agent root for the CHEX subsystem. See `specs/portfolio.yaml`
and [ADR 0007](docs/adr/0007-opal-policy-mirror.md).

| Repo | Role | Agent edits |
|------|------|-------------|
| Healthcare-Data-Exchange (this repo) | canonical | Yes |
| [healthcare-policy](https://github.com/SafetyMP/healthcare-policy) | policy-mirror | No — run `./scripts/sync-policy-repo.sh` |

After changes under `policy/*.rego`, run `./scripts/sync-policy-repo.sh` before `./scripts/demo.sh`
or claiming OPAL policy is current.

## Commands

| Command | Purpose |
|---------|---------|
| `./scripts/check-harness.sh` | Validate multi-repo harness + corp-site overlay |
| `./scripts/verify.sh` | Definition of Done (hermetic: harness + go + python×3 + opa) |
| `./scripts/run-dev.sh` | Start EU + US cells + OPAL (`--down-first` to recycle) |
| `./scripts/teardown-dev.sh` | Stop compose stack (`--volumes` to drop DB volumes) |
| `./scripts/setup-portfolio.sh` | Clone sibling repos from `specs/portfolio.yaml` |
| `./scripts/demo.sh` | Cooperative E2E |
| `./scripts/adversarial.sh` | Tier-3 adversarial oracle |
| `./scripts/sync-policy-repo.sh` | Mirror `policy/*.rego` to healthcare-policy |
| `./scripts/check-portfolio.sh` | Portfolio contract + policy sync drift |
| `./scripts/check-portfolio-cross-repo.sh` | Cross-repo stamp vs mirror pointer |
| `cd web && npm run verify` | Web UI typecheck + build + smoke + axe |

## Definition of Done

```bash
./scripts/verify.sh
./scripts/demo.sh            # cooperative tier — stack up
./scripts/adversarial.sh     # tier-3 denies — after demo or standalone when stack up
cd web && npm run verify   # optional: clinician console (requires gateway for live API)
```

`verify.sh` is hermetic (no Docker) and gates the agent stop hook. Compose E2E is two scripts: cooperative `./scripts/demo.sh` and adversarial `./scripts/adversarial.sh` — enforced in CI via `demo-e2e` workflow. Threat model: `docs/adr/0000-threat-model.md` + `specs/threat-model.yaml`.

## Layout

| Path | Purpose |
|------|---------|
| `.corp-harness/site.json` | Corp-site binding (unbound until a program) |
| `.harness/` | Multi-repo harness (solo profile + policy-sync-stamp) — keep live |
| `specs/MANDATE.md` | Multi-agent fleet contract (HALTED — phase 3 archive) |
| `specs/portfolio.yaml` | Multi-repo contract (canonical + healthcare-policy) |
| `services/gateway/` | Go jurisdiction router + OPA PEP + identity broker + consent proxy |
| `services/ai-governance/` | Python FastAPI AI governance stub |
| `services/consent-service/` | Python FastAPI consent state + OPAL data source (ADR 0008) |
| `services/identity-broker/` | Python FastAPI ITI-78 identifier resolve (ADR 0010) |
| `web/` | Next.js clinician console (BFF → gateway :8081) |
| `policy/` | OPA Rego policies + tests (canonical; consent from `data.consent`) |
| `deploy/docker-compose.yml` | EU + US cells + OPAL (server/client/broadcast) |
| `config/` | Routing, identity registry, OPAL hardening, EU auth, SSRAA |
| `fhir/samples/` | Synthetic Patient resources (eu/, us/) |
| `docs/` | Product mandate, architecture, ADRs (incl. 0007–0011), roadmap |

## Coding rules

- Smallest correct diff; match existing conventions.
- Never read or print `.env` contents.
- Reopen parallel work via `proceed` + refreshed `specs/MANDATE.md` before fleet tracks.

## Cursor Cloud specific instructions

- **Hermetic verify:** `./scripts/verify.sh` installs a Python `.venv` under `services/ai-governance/` and downloads OPA to `.tools/bin/` on first run.
- **Docker demo:** `./scripts/run-dev.sh` then `./scripts/demo.sh` — HAPI JVM boot can take 2+ minutes per cell.
- Hooks: `python3 .cursor/hooks/<hook>.py < payload.json` — avoid blocked patterns on the shell command line when testing guards.
