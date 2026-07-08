# Documentation — Cloud Healthcare Exchange

Design authority for the **Cloud Healthcare Exchange** reference implementation.

New here? Start with the [repository README](../README.md) for quick start and demo overview.

## Start here

| Document | Description |
|----------|-------------|
| [product-mandate.md](product-mandate.md) | Vision, users, tri-regime scope |
| [plan.md](plan.md) | Implementation plan, todos, fleet playbook |
| [roadmap.md](roadmap.md) | Phases and regulatory deadlines |

## Architecture

| Document | Description |
|----------|-------------|
| [architecture/overview.md](architecture/overview.md) | System components and planes |
| [architecture/compliance-mapping.md](architecture/compliance-mapping.md) | FedRAMP / GDPR / AI Act / EHDS / TEFCA |
| [architecture/data-flows.md](architecture/data-flows.md) | Sequence diagrams (intra-EU primary) |

## Architecture Decision Records

| ADR | Topic |
|-----|-------|
| [0001](adr/0001-jurisdiction-cells.md) | Jurisdiction cells |
| [0002](adr/0002-policy-opa-cedar.md) | OPA / Rego (+ Cedar notes) |
| [0003](adr/0003-key-custody-crypto-shred.md) | Key custody and erasure |
| [0004](adr/0004-fhir-us-core-interop.md) | FHIR R4 / US Core |
| [0005](adr/0005-ai-governance-layer.md) | AI governance layer |
| [0006](adr/0006-patient-identity-matching.md) | Federated patient identity |
| [0007](adr/0007-opal-policy-mirror.md) | OPAL policy-mirror repository |
| [0008](adr/0008-opal-consent-sync.md) | Dynamic consent sync with OPAL |
| [0009](adr/0009-ssraa-auth-stub.md) | SSRAA US auth stub |
| [0010](adr/0010-identity-broker-service.md) | Identity broker service |
| [0011](adr/0011-opal-production-hardening.md) | OPAL production hardening |

Policy mirror (two-repo split): [ADR 0007](adr/0007-opal-policy-mirror.md), [specs/portfolio.yaml](../specs/portfolio.yaml), and [healthcare-policy](https://github.com/SafetyMP/healthcare-policy).

## Reference

- [glossary.md](glossary.md)
- [references.md](references.md)
- [CHANGELOG.md](../CHANGELOG.md) — release history
- [GOVERNANCE.md](../GOVERNANCE.md) — maintainers and decision process
- [assets/](assets/) — [architecture diagrams](assets/README.md) (cells, components, OPAL flow) and social preview
- [maintainer-github-settings.md](maintainer-github-settings.md) — GitHub UI settings checklist
