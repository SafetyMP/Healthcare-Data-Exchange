# ADR 0002: Policy-as-Code with OPA (Rego) and Cedar Notes

**Status:** Accepted  
**Date:** 2026-07-08  
**Product:** Cloud Healthcare Exchange

## Context

Residency, purpose, consent, and minimum-necessary rules change frequently (EHDS implementing acts, tenant contracts, consent withdrawals). Hard-coded gateway logic is unmaintainable and unauditable.

## Decision

Use **Open Policy Agent (OPA)** with **Rego** as the primary Policy Decision Point (PDP):

- Policies in consolidated `policy/authz.rego` (residency, consent via `data.consent`, purpose).
- Gateway (Go PEP) calls OPA with structured JSON input; enforces allow/deny and obligation hints (field filters).
- Unit tests via `opa test policy/`.

**Cedar** is noted for future **entity-centric authorization** (fine-grained resource attributes) but is not the PoC PDP. **OPAL consent sync is implemented in the PoC** (ADR 0008); `consent-service` publishes revocations to the opal-client bundle.

### Deployment evolution

| Stage | Integration |
|-------|-------------|
| PoC | OPA container; gateway HTTP call |
| Production | Envoy `ext_authz` sidecar; sub-ms path in mesh |

PoC does **not** demonstrate mesh latency benefits; Go gateway is chosen for production alignment, not PoC performance claims.

## Consequences

**Positive**

- Policies versioned in Git; reviewable diffs.
- Same rules testable in CI (`opa test`).
- Industry-standard CNCF component.

**Negative**

- Rego learning curve.
- HTTP OPA call adds latency in PoC (acceptable for reference slice).

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Custom Go if/else policy | Unmaintainable at scale |
| Cedar-only | Less ecosystem for K8s sidecar patterns today; may complement later |
| XACML appliance | Heavier ops; less developer ergonomics |

## References

- REF-INT-06 (OPA)
- REF-INT-07 (Cedar)
- REF-INT-08 (OPAL)
