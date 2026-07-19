# ADR 0004: FHIR R4 and US Core Interoperability Baseline

**Status:** Accepted  
**Date:** 2026-07-08  
**Updated:** 2026-07-18  
**Product:** Cloud Healthcare Exchange

## Context

Cloud Healthcare Exchange must interoperate with US QHIN/TEFCA ecosystems and EU EHDS/MyHealth@EU patterns. Ad-hoc REST APIs would fail adoption and SSRAA expectations.

As of July 2026:

- ONC certification requires **USCDI v3** (HTI-1; USCDI v1 expired **2026-01-01**).
- TEFCA **Facilitated FHIR SOP 2.0** (effective **2026-03-08**) requires FHIR R4 **4.0.1** and **US Core ≥ 6.1.0**.
- USCDI **v6** is published; **v7** final is targeted for July 2026 (ONC SB26-1) — track, do not mandate for PoC until mapped.

CHEX is a **pattern PoC**, not ONC-certified health IT or a TEFCA QHIN Participant.

## Decision

- **FHIR R4** (4.0.1) as the sole clinical API in each jurisdiction cell.
- **US cell floor:** [US Core IG](https://hl7.org/fhir/us/core/) **6.1.0** + **USCDI v3** data classes for PoC samples.
- **US cell track (not PoC-mandatory):** USCDI v6 / v7 via SVAP-style adoption after final publication and a matching US Core release.
- **EU cell:** FHIR R4 with EU-relevant profiles (Patient, Consent, Observation for demo); full EHDS profile set phased.
- **Server:** HAPI FHIR via `hapiproject/hapi` Docker image per cell, dedicated Postgres.
- **CapabilityStatement honesty:** Gateway serves a limited US CapabilityStatement at `/v1/fhir/metadata` (`fhir/capability/us-cell.json`) stating R4 + US Core 6.1.0 intent and the PoC resource subset — not a claim of full US Core coverage.
- **Provenance:** FHIR Provenance resources for clinically significant exports (target).
- **Auth (production):** SSRAA / UDAP for US nodes (required **2027-01-01** for new nodes; interim Jul/Nov 2026 milestones); EU NCP trust frameworks (Phase).
- **TEFCA XP (PoC):** Optional/derived `X-TEFCA-XP` allowlist (`T-TREAT`, `T-IAS`, `T-HCO`) enforced in OPA for unknown codes — not RCE Directory or QHIN participation.

### Sample data

- `fhir/samples/`: Synthetic Patient resources (US: US Core Patient profile; EU: base Patient). **Not** a full USCDI v3 element set.

### Alternatives noted

| Option | When |
|--------|------|
| **Medplum** | Lighter PoC if HAPI JVM footprint is prohibitive |
| **Custom FastAPI subset** | Rejected — insufficient interop credibility |

## Consequences

**Positive**

- Direct QHIN/EHDS alignment path at the Facilitated FHIR floor.
- Clear USCDI version pin vs marketing overclaim.

**Negative**

- JVM + Postgres per cell is heavy for local dev.
- US Core / USCDI full coverage is large; PoC uses minimal resource set.

## PoC resource scope

| Resource | US | EU demo | Notes |
|----------|----|---------|-------|
| Patient | Yes | Yes | US: US Core Patient profile |
| Consent | Yes | Yes | Gateway/consent-service; not full FHIR Consent UX |
| Observation | Yes | Optional | Samples may omit |
| Provenance | Phase | Phase | Target for clinically significant exports |
| CapabilityStatement | Yes (gateway) | HAPI default | US honesty document at `/v1/fhir/metadata` |

## References

- REF-INT-01, REF-INT-02, REF-INT-03, REF-INT-04, REF-INT-09, REF-INT-10
- REF-FED-04, REF-FED-05, REF-FED-07, REF-FED-08
- REF-EHDS-02
