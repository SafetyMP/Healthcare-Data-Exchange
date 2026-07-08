# ADR 0009: SSRAA Application Association Stub (US FHIR Auth)

**Status:** Accepted
**Date:** 2026-07-08
**Product:** Cloud Healthcare Exchange

## Context

ONC **SSRAA** (Secure, Standards-Based Application Association) becomes required
for new US FHIR nodes on **2027-01-01**. The US cell in CHEX proxies to HAPI US
for TEFCA secondary flows; without an authentication gate, any caller could read
US-home patients once policy allows — insufficient for the regulatory story in
ADR 0004.

Production SSRAA uses UDAP-style dynamic client registration and token exchange.
The walking skeleton needs a **credible stub** that gates US-cell reads without
claiming full conformance.

## Decision

- Register application associations in `config/ssraa.yaml` (client id + shared
  secret + scopes). No PHI; control-plane credentials only.
- Gateway validates `Authorization: Bearer <client_id>.<secret>` **before** the
  OPA PEP when the routed home cell is `us` **and** the requester jurisdiction is
  US (`us-*`). EU requesters hitting US-home data are denied by residency policy
  without SSRAA (cross-bloc deny demo).
- EU-cell reads are unchanged (no SSRAA).
- Hermetic unit tests in `services/gateway/internal/ssraa/`; compose E2E in
  `demo.sh` steps 5a (401 without token) and 5 (200 with token).

### PoC token shape

```
Authorization: Bearer tefca-demo-client.demo-ssraa-secret
```

Production would replace this with signed JWTs / UDAP token endpoint output.

## Consequences

**Positive**

- US TEFCA demo path documents SSRAA as a first-class gate.
- Clear extension point for real UDAP integration in Phase 4b+.

**Negative**

- Shared-secret bearer is not SSRAA-conformant — labeled stub only.
- Secrets in YAML are demo placeholders; production uses vault/HSM.

## References

- ADR 0004 (US Core / SSRAA target)
- `config/ssraa.yaml`, `services/gateway/internal/ssraa/`
- REF-FED-05
