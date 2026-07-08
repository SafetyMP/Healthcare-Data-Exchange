# ADR 0010: Identity Broker Service

**Status:** Accepted  
**Date:** 2026-07-08  
**Product:** Cloud Healthcare Exchange

## Context

ADR 0006 defines federated patient identity resolution (ITI-78 preferred identifier →
home jurisdiction routing token). Phase 3 implemented a **config-only stub** in
`config/routing.yaml` exposed via `GET /v1/identity/resolve` on the gateway.

Phase 4b requires moving identifier lookup to a dedicated control-plane service so
the gateway can register new preferred identifiers at runtime and mirror the NCP
federation contract without embedding identifier maps in routing config.

## Decision

1. Add **`services/identity-broker/`** — FastAPI service on port **8085**:
   - `GET /v1/resolve?identifier=` — ITI-78-style preferred-identifier lookup
   - `GET /v1/resolve?subject=` — subject → home jurisdiction
   - `POST /v1/identifiers` — register preferred identifier (demo/admin)
   - Seed from `config/identity-registry.yaml` (no PHI)

2. Gateway **`internal/identity`** HTTP client calls the broker first for identifier
   and subject resolution; on miss or transport error, **falls back** to
   `config/routing.yaml` (`identity_broker.identifiers` + `subjects`).

3. `deploy/docker-compose.yml` runs `identity-broker`; gateway sets
   `CHEX_IDENTITY_BROKER_URL=http://identity-broker:8085`.

4. `scripts/demo.sh` steps **6a/6/6b** prove direct broker resolve, gateway proxy,
   and patient read by dynamically registered identifier.

## Consequences

**Positive**

- Separates identifier federation from jurisdiction routing / consent metadata.
- Runtime identifier registration without editing `routing.yaml`.
- Hermetic pytest + gateway httptest coverage.

**Negative**

- Two config sources for identifiers (registry YAML + routing fallback) until NCP
  federation replaces both in Phase 2.
- No authentication on `POST /v1/identifiers` (PoC only).

## PoC simplification

No live NCP or PDQm endpoints; registry is file-backed. Full ITI-78 against home
MPI remains Phase 2 per ADR 0006.

## References

- ADR 0006 — Patient identity and federated matching
- `config/identity-registry.yaml`
- `services/identity-broker/`
