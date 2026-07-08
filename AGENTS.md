# AGENTS.md — Cloud Healthcare Exchange

Harness profile: **solo** — phase 3 complete; `specs/MANDATE.md` HALTED. See `docs/plan.md` and `docs/roadmap.md`.

## Commands

| Command | Purpose |
|---------|---------|
| `./scripts/check-harness.sh` | Validate harness files and hook syntax |
| `./scripts/verify.sh` | Definition of Done (hermetic: harness + go + python + opa) |
| `./scripts/run-dev.sh` | Start EU + US cells via `deploy/docker-compose.yml` (requires Docker) |
| `./scripts/demo.sh` | E2E: intra-EU, US TEFCA, cross-bloc deny/exception, AI oversight, crypto-shred |
| `./scripts/setup-phase3-worktrees.sh` | Create worktrees for parallel tracks (historical) |
| `./scripts/teardown-phase3-worktrees.sh` | Remove merged phase 3 worktrees and agent branches |

## Definition of Done

```bash
./scripts/verify.sh
```

`verify.sh` does **not** require Docker. Compose E2E is `demo.sh` only.

## Layout

| Path | Purpose |
|------|---------|
| `specs/MANDATE.md` | Multi-agent contract (HALTED — phase 3 archive) |
| `services/gateway/` | Go jurisdiction router + OPA PEP + identity broker stub |
| `services/ai-governance/` | Python FastAPI AI governance stub |
| `policy/` | OPA Rego policies + tests |
| `deploy/docker-compose.yml` | EU + US walking skeleton |
| `config/routing.yaml` | Identity broker stub + jurisdiction routing |
| `fhir/samples/` | Synthetic Patient resources (eu/, us/) |
| `docs/` | Product mandate, architecture, ADRs, roadmap |

## Coding rules

- Smallest correct diff; match existing conventions.
- Never read or print `.env` contents.
- Reopen parallel work via `proceed` + refreshed `specs/MANDATE.md` before fleet tracks.

## Cursor Cloud specific instructions

- **Hermetic verify:** `./scripts/verify.sh` installs a Python `.venv` under `services/ai-governance/` and downloads OPA to `.tools/bin/` on first run.
- **Docker demo:** `./scripts/run-dev.sh` then `./scripts/demo.sh` — HAPI JVM boot can take 2+ minutes per cell.
- Hooks: `python3 .cursor/hooks/<hook>.py < payload.json` — avoid blocked patterns on the shell command line when testing guards.
