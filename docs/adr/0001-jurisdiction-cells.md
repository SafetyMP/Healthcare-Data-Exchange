# ADR 0001: Jurisdiction Cells

**Status:** Accepted  
**Date:** 2026-07-08  
**Product:** Cloud Healthcare Exchange

## Context

A global health exchange must serve US government, EU, and other tenants under conflicting residency, transfer, and security rules. Centralizing PHI in one database violates SA-9(5) (US High data location), GDPR Chapter V, and EHDS sovereignty expectations.

## Decision

Partition the platform into **jurisdiction cells**:

- Each cell contains: regional gateway (PEP), OPA PDP instance, HAPI FHIR + dedicated Postgres, regional key custody, regional audit sink.
- A **global control plane** holds routing, tenant registry, policy distribution metadata, identity broker configuration, and AI governance registry — **no PHI**.

Cross-cell communication carries **routing tokens and policy context**, not patient resources, except in explicitly gated exception flows (minimum-necessary derivatives).

## Consequences

**Positive**

- Clear blast radius and residency story for auditors.
- Independent scaling and outage isolation per region.
- Aligns with TEFCA (US entities) and EHDS (national NCP boundaries).

**Negative**

- Operational complexity: N cells × (FHIR + DB + keys + policy).
- Cross-cell consistency requires GitOps / policy bundle versioning.
- No single-query global patient view (by design).

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Single global FHIR server | Fails residency and transfer rules |
| Row-level `region` column in one DB | Weaker isolation; harder shred and audit boundaries |
| Blockchain global ledger | Does not solve legal residency; adds complexity |

## References

- [product-mandate.md](../product-mandate.md)
- REF-FED-02 (SA-9(5))
- REF-EHDS-01
