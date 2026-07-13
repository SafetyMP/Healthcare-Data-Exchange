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

- Register **US** application associations in `config/ssraa.yaml` (SSRAA stub).
  Register **EU** caller associations in `config/eu-auth.yaml` (EHDS-style bearer stub).
  Both use the shared `principal.Broker` — no single SSRAA registry for all cells.
- Gateway validates `Authorization: Bearer <client_id>.<secret>` **before** the
  OPA PEP on every patient read. Requester jurisdiction and cross-bloc flags are
  derived only from the verified **principal** (cell + auth kind) — never query
  params or the subject record.
- US-home FHIR reads without a valid US SSRAA association → `401` (`ssraa_required`).
  EU-home reads without a valid EU bearer → `401` (`credential_required`).
  Cross-bloc residency is enforced by OPA after principal resolution.

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
- `config/eu-auth.yaml`, `config/ssraa.yaml`, `services/gateway/internal/principal/`
- REF-FED-05
