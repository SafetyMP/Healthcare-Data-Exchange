# ADR 0009: SSRAA Application Association Stub (US FHIR Auth)

**Status:** Accepted  
**Date:** 2026-07-08  
**Updated:** 2026-07-18  
**Product:** Cloud Healthcare Exchange

## Context

ONC / TEFCA **SSRAA** (Security for Scalable Registration, Authentication, and Authorization — HL7 FAST UDAP) becomes required for **new** US FHIR nodes published to the TEFCA production directory on **2027-01-01** (Facilitated FHIR Implementation SOP 2.0). Interim milestones:

| Date | Milestone | CHEX stance |
|------|-----------|-------------|
| **2026-07-01** | SSRAA-capable testing systems for production Facilitated FHIR nodes | Stub + docs readiness |
| **2026-11-01** | QHINs can onboard/support SSRAA-based authentication | Out of scope (not a QHIN) |
| **2027-01-01** | New FHIR nodes SHALL support SSRAA | Production target for US cell |

The US cell in CHEX proxies to HAPI US for TEFCA-pattern flows; without an authentication gate, any caller could read US-home patients once policy allows — insufficient for the regulatory story in ADR 0004.

Production SSRAA uses UDAP-style dynamic client registration and token exchange. The walking skeleton needs a **credible stub** that gates US-cell reads without claiming full conformance.

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
- Phase 4b+ replaces this stub with HL7 FAST UDAP / SSRAA IG dynamic registration
  and signed tokens — not in this ADR's PoC scope.

### PoC token shape

```
Authorization: Bearer tefca-demo-client.demo-ssraa-secret
```

Production would replace this with signed JWTs / UDAP token endpoint output.

## Consequences

**Positive**

- US TEFCA demo path documents SSRAA as a first-class gate.
- Clear extension point for real UDAP integration along the Jul/Nov 2026 → Jan 2027 path.

**Negative**

- Shared-secret bearer is not SSRAA-conformant — labeled stub only.
- Secrets in YAML are demo placeholders; production uses vault/HSM.

## References

- ADR 0004 (US Core / SSRAA target)
- `config/eu-auth.yaml`, `config/ssraa.yaml`, `services/gateway/internal/principal/`
- REF-FED-05, REF-FED-07
