# AGENTS.md — Cloud Healthcare Exchange

Harness profile: **solo** — phase 2a EU walking skeleton complete. See `docs/plan.md`.

## Commands

| Command | Purpose |
|---------|---------|
| `./scripts/check-harness.sh` | Validate harness files and hook syntax |
| `./scripts/verify.sh` | Definition of Done (hermetic: harness + go + python + opa) |
| `./scripts/run-dev.sh` | Start EU cell via `deploy/docker-compose.yml` (requires Docker) |
| `./scripts/demo.sh` | End-to-end demo: intra-EU read, consent deny, AI oversight, crypto-shred |

## Definition of Done

```bash
./scripts/verify.sh
```

`verify.sh` does **not** require Docker. Compose E2E is `demo.sh` only.

## Layout

| Path | Purpose |
|------|---------|
| `services/gateway/` | Go jurisdiction router + OPA PEP |
| `services/ai-governance/` | Python FastAPI AI governance stub |
| `policy/` | OPA Rego policies + tests |
| `deploy/docker-compose.yml` | EU walking skeleton (HAPI, Postgres, OPA, gateway, AI gov) |
| `config/routing.yaml` | Identity broker stub + jurisdiction routing |
| `fhir/samples/` | Synthetic EU Patient resources |
| `docs/` | Product mandate, architecture, ADRs |

## Cloud agents

- Guards vendored under `.cursor/hooks/`.
- `stop` / verify-on-stop is IDE-only; cloud agents run `./scripts/verify.sh` + CI.
- Repo linked at [cursor.com/dashboard](https://cursor.com/dashboard) for `/in-cloud`.

## Coding rules

- Smallest correct diff; match existing conventions.
- Never read or print `.env` contents.

## Cursor Cloud specific instructions

- **Hermetic verify:** `./scripts/verify.sh` installs a Python `.venv` under `services/ai-governance/` and downloads OPA to `.tools/bin/` on first run.
- **Docker demo:** `./scripts/run-dev.sh` then `./scripts/demo.sh` — HAPI JVM boot can take 2+ minutes.
- Hooks: `python3 .cursor/hooks/<hook>.py < payload.json` — avoid blocked patterns on the shell command line when testing guards.
