# ADR 0011: OPAL Production Hardening

**Status:** Accepted  
**Date:** 2026-07-08  
**Product:** Cloud Healthcare Exchange

## Context

Phase 4a adopted OPAL for dynamic consent sync (ADR 0008) and policy mirroring
(ADR 0007). The PoC ran OPAL in **open mode**: no client authentication, no
webhook secret, 30s policy polling, and unsigned policy bundles. ADR 0008
explicitly listed these as out of scope.

Phase 4b requires credible production hardening without claiming full FedRAMP or
cosign-grade supply-chain controls.

## Decision

### 1. Secure mode (JWT client auth)

- `opal-server` runs with `OPAL_AUTH_PRIVATE_KEY`, `OPAL_AUTH_PUBLIC_KEY`, and
  `OPAL_AUTH_MASTER_TOKEN` from `deploy/opal/dev-secrets.env` (generated locally,
  gitignored).
- `opal-client` obtains a JWT at startup via `deploy/opal/entrypoint-client.sh`
  and sets `OPAL_CLIENT_TOKEN`.
- `consent-service` mints a datasource JWT from the master token (`POST /token`)
  and sends it on `POST /data/config` when `CHEX_OPAL_SECURE=1`.

### 2. Webhook-first policy sync (polling fallback)

- `OPAL_POLICY_REPO_WEBHOOK_SECRET` validates GitHub-style push webhooks at
  `POST /webhook`.
- `OPAL_POLICY_REPO_POLLING_INTERVAL=300` remains as fallback (was 30s).
- `scripts/trigger-opal-policy-webhook.sh` simulates a push after
  `sync-policy-repo.sh` when the stack is running.

### 3. Bundle integrity (PoC)

- Canonical `policy/*.rego` hash is recorded in `.harness/policy-sync-stamp` and
  mirrored to `healthcare-policy/.harness/canonical-pointer`.
- `scripts/check-policy-bundle.sh` verifies local policy matches the stamp.
- **Gap:** cosign/sigstore signed bundles are **not** implemented; hash-only.

### 4. Configuration contract

- `config/opal-hardening.yaml` documents modes, scripts, and explicit gaps.
- `scripts/check-opal-hardening.sh` provides hermetic wiring checks in
  `verify.sh`.

### 5. Demo evidence

- `demo.sh` step 0: unauthenticated `POST /data/config` returns 401/403 in secure
  mode.
- `demo.sh` step 0b: policy bundle hash matches stamp.
- Existing steps 7/7a/7b continue to prove authenticated consent publish works.

## Consequences

**Positive**

- OPAL control plane matches production topology more closely.
- Webhook path reduces poll noise; polling remains as safety net.
- Bundle drift is detectable before demo/OPAL claims.

**Negative / gaps (explicit)**

| Gap | Status |
|-----|--------|
| cosign/sigstore signed bundles | Not implemented |
| mTLS OPAL server ↔ client | Not implemented |
| Auth on consent `/policy-data` | Internal network only |
| HSM-backed OPAL keys | File/env in PoC |
| Real GitHub webhook from healthcare-policy | Local trigger script only |

## References

- ADR 0007 — OPAL policy-mirror repository
- ADR 0008 — Dynamic consent sync with OPAL
- `config/opal-hardening.yaml`
- [OPAL security parameters](https://docs.opal.ac/getting-started/running-opal/run-opal-server/security-parameters)
