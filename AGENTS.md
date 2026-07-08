# AGENTS.md — Cloud Healthcare Exchange

Harness profile: **solo** — phase 3 + phase 4a complete; `specs/MANDATE.md` HALTED. See [README.md](README.md), [docs/plan.md](docs/plan.md), and [docs/roadmap.md](docs/roadmap.md).

## Commands

| Command | Purpose |
|---------|---------|
| `./scripts/check-harness.sh` | Validate harness files and hook syntax |
| `./scripts/verify.sh` | Definition of Done (hermetic: harness + go + python×3 + opa) |
| `./scripts/run-dev.sh` | Start EU + US cells + OPAL (`--down-first` to recycle). OPAL alpine images run native on arm64. |
| `./scripts/teardown-dev.sh` | Stop compose stack (`--volumes` to drop DB volumes) |
| `./scripts/setup-portfolio.sh` | Clone sibling repos from `specs/portfolio.yaml` (e.g. healthcare-policy) |
| `./scripts/demo.sh` | E2E: intra-EU, US TEFCA + SSRAA, cross-bloc, live consent revoke, AI, crypto-shred |
| `./scripts/generate-opal-dev-secrets.sh` | Create local OPAL secure-mode secrets (first `run-dev.sh`) |
| `./scripts/sync-policy-repo.sh` | Mirror `policy/*.rego` to [healthcare-policy](https://github.com/SafetyMP/healthcare-policy) (OPAL, ADR 0007) |
| `./scripts/trigger-opal-policy-webhook.sh` | Simulate GitHub push webhook to OPAL after policy sync |
| `./scripts/check-portfolio.sh` | Portfolio contract + policy sync drift |
| `./scripts/check-portfolio-cross-repo.sh` | Cross-repo stamp vs mirror pointer (CI / local with `CHEX_PORTFOLIO_MIRROR_PATH`) |
| `./scripts/render-social-preview.sh` | Render `docs/assets/social-preview.png` from SVG |
| `./scripts/upload-social-preview.sh` | Upload social preview to GitHub settings (Playwright; run `--login` once) |
| `./scripts/setup-phase3-worktrees.sh` | Create worktrees for parallel tracks (historical) |
| `./scripts/teardown-phase3-worktrees.sh` | Remove merged phase 3 worktrees and agent branches |

## Portfolio (multi-repo)

This repo is the **canonical** agent root. See `specs/portfolio.yaml` and [ADR 0007](docs/adr/0007-opal-policy-mirror.md) (policy mirror; ADR 0008 covers consent sync).

| Repo | Role | Agent edits |
|------|------|-------------|
| Healthcare-Data-Exchange (this repo) | canonical | Yes |
| [healthcare-policy](https://github.com/SafetyMP/healthcare-policy) | policy-mirror | No — run `./scripts/sync-policy-repo.sh` |

After changes under `policy/*.rego`, run `./scripts/sync-policy-repo.sh` before `./scripts/demo.sh` or claiming OPAL policy is current.

## Definition of Done

```bash
./scripts/verify.sh
```

`verify.sh` does **not** require Docker. Compose E2E is `demo.sh` only.

## Layout

| Path | Purpose |
|------|---------|
| `specs/MANDATE.md` | Multi-agent contract (HALTED — phase 3 archive) |
| `specs/portfolio.yaml` | Multi-repo contract (canonical + healthcare-policy) |
| `services/gateway/` | Go jurisdiction router + OPA PEP + identity broker + consent proxy |
| `services/ai-governance/` | Python FastAPI AI governance stub |
| `services/consent-service/` | Python FastAPI consent state + OPAL data source (ADR 0008) |
| `services/identity-broker/` | Python FastAPI ITI-78 identifier resolve (ADR 0010) |
| `policy/` | OPA Rego policies + tests (canonical; consent from `data.consent`) |
| `deploy/docker-compose.yml` | EU + US cells + OPAL (server/client/broadcast) |
| `config/routing.yaml` | Jurisdiction routing + subject registry (identifier fallback) |
| `config/identity-registry.yaml` | Preferred identifiers for identity-broker (ADR 0010) |
| `config/opal-hardening.yaml` | OPAL secure mode + webhook + bundle integrity profile (ADR 0011) |
| `config/ssraa.yaml` | SSRAA application association stub (ADR 0009) |
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
