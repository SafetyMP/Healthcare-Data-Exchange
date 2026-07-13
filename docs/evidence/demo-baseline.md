# Demo E2E baseline capture

**Instrument:** `./scripts/demo.sh` (same gate as `.github/workflows/demo-e2e.yml`)

## 2026-07-13 — pre-principal refactor (SSRAA-everywhere)

- **Command:** `./scripts/demo.sh` after `./scripts/run-dev.sh`
- **Exit code:** `0` (all 9 scenarios passed)
- **Architectural debt:** Single SSRAA registry held EU + US credentials; US regulatory stub applied to all cells.
- **Full log:** captured at `/tmp/chex-demo-baseline.log` during agent session (not committed — re-run locally to reproduce).

## Acceptance gate (current)

Done means:

1. `./scripts/verify.sh` — handler tests evaluate the **real** Rego bundle via `opa eval`
2. `./scripts/demo.sh` — exit `0` against Docker Compose

Scenario rows in README are verified claims only when (2) is green in CI.

## 2026-07-13 — post-principal refactor (per-cell auth)

- **Command:** `./scripts/demo.sh` after gateway rebuild with `principal.Broker`
- **Exit code:** `0`
- **Architecture:** `config/eu-auth.yaml` (EU bearer) + `config/ssraa.yaml` (US SSRAA only) → `services/gateway/internal/principal/`
- **Log:** `/tmp/chex-demo-post-principal.log` (agent session; re-run locally to reproduce)
