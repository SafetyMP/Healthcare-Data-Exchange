# AGENTS.md — Cloud Healthcare Exchange

Harness profile: **fleet** — phase 3 parallel tracks active. See `specs/MANDATE.md` and `docs/plan.md`.

## Commands

| Command | Purpose |
|---------|---------|
| `./scripts/check-harness.sh` | Validate harness files and hook syntax |
| `./scripts/verify.sh` | Definition of Done (hermetic: harness + go + python + opa) |
| `./scripts/run-dev.sh` | Start EU cell via `deploy/docker-compose.yml` (requires Docker) |
| `./scripts/demo.sh` | End-to-end demo: intra-EU read, consent deny, AI oversight, crypto-shred |
| `./scripts/setup-phase3-worktrees.sh` | Create worktrees for phase 3 parallel child agents |

## Fleet tracks (phase 3)

| Track | Branch | Scope |
|-------|--------|-------|
| `us-cell` | `agent/us-cell` | US HAPI + Postgres in compose, `fhir/samples/us/` |
| `gateway-policy` | `agent/gateway-policy` | `services/gateway/`, `config/routing.yaml` |
| `policy` | `agent/policy` | `policy/` cross-bloc Rego |
| `integrate` | `main` | merge, `demo.sh`, `verify.sh` — **parent only** |

## Definition of Done

```bash
./scripts/verify.sh
```

`verify.sh` does **not** require Docker. Compose E2E is `demo.sh` only (parent on `main`).

## Layout

| Path | Purpose |
|------|---------|
| `specs/MANDATE.md` | Multi-agent coordination contract (ACTIVE) |
| `services/gateway/` | Go jurisdiction router + OPA PEP |
| `services/ai-governance/` | Python FastAPI AI governance stub |
| `policy/` | OPA Rego policies + tests |
| `deploy/docker-compose.yml` | EU walking skeleton (+ US cell in phase 3) |
| `config/routing.yaml` | Identity broker stub + jurisdiction routing |
| `fhir/samples/` | Synthetic Patient resources |
| `docs/` | Product mandate, architecture, ADRs |

## Cloud agents

- Guards vendored under `.cursor/hooks/` (fleet halt/negotiate + subagent handoff).
- `stop` / verify-on-stop is IDE-only; cloud agents run `./scripts/verify.sh` + CI.
- Spawn **one cloud agent per branch**; parent merges on `main`.

## Coding rules

- Smallest correct diff; match existing conventions.
- Never read or print `.env` contents.
- Children stay within `specs/MANDATE.md` ownership; parent re-verifies after merge.

## Cursor Cloud specific instructions

- **Hermetic verify:** `./scripts/verify.sh` installs a Python `.venv` under `services/ai-governance/` and downloads OPA to `.tools/bin/` on first run.
- **Docker demo:** `./scripts/run-dev.sh` then `./scripts/demo.sh` — HAPI JVM boot can take 2+ minutes.
- Hooks: `python3 .cursor/hooks/<hook>.py < payload.json` — avoid blocked patterns on the shell command line when testing guards.
