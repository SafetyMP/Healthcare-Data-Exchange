# ADR 0004: FHIR R4 and US Core Interoperability Baseline

**Status:** Accepted  
**Date:** 2026-07-08  
**Product:** Cloud Healthcare Exchange

## Context

Cloud Healthcare Exchange must interoperate with US QHIN/TEFCA ecosystems and EU EHDS/MyHealth@EU patterns. Ad-hoc REST APIs would fail adoption and SSRAA expectations.

## Decision

- **FHIR R4** as the sole clinical API in each jurisdiction cell.
- **US cell:** [US Core IG](https://hl7.org/fhir/us/core/) **6.1.0** + **USCDI** data classes for PoC samples.
- **EU cell:** FHIR R4 with EU-relevant profiles (Patient, Consent, Observation for demo); full EHDS profile set phased.
- **Server:** HAPI FHIR via `hapiproject/hapi` Docker image per cell, dedicated Postgres.
- **Provenance:** FHIR Provenance resources for clinically significant exports (target).
- **Auth (production):** SSRAA / UDAP for US nodes (required 2027-01-01 for new nodes); EU NCP trust frameworks (Phase).

### Sample data

- `fhir/` directory: Synthea-derived sample bundles for US and EU patients (synthetic, no real PHI).

### Alternatives noted

| Option | When |
|--------|------|
| **Medplum** | Lighter PoC if HAPI JVM footprint is prohibitive |
| **Custom FastAPI subset** | Rejected — insufficient interop credibility |

## Consequences

**Positive**

- Direct QHIN/EHDS alignment path.
- Standard search, consent, and audit resources.

**Negative**

- JVM + Postgres per cell is heavy for local dev.
- US Core full coverage is large; PoC uses minimal resource set.

## PoC resource scope

| Resource | US | EU demo |
|----------|-----|---------|
| Patient | Yes | Yes |
| Consent | Yes | Yes |
| Observation | Yes | Optional |
| Provenance | Phase | Phase |

## References

- REF-INT-01, REF-INT-02, REF-INT-03, REF-INT-04
- REF-FED-04, REF-FED-05
- REF-EHDS-02
