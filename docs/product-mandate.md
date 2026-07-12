# Product Mandate — Cloud Healthcare Exchange

**Product name:** Cloud Healthcare Exchange  
**Status:** Draft mandate (reference implementation + design authority)  
**Last updated:** 2026-07-08

---

## Vision

Cloud Healthcare Exchange is a **globally distributed, multi-tenant health information exchange** that enables authorized clinical and administrative actors to access health data across organizational and jurisdictional boundaries **without centralizing protected health information (PHI)** in a global data plane.

The platform is architected as a **federation of regional jurisdiction cells**, each operating under local law and security baselines, connected by a **PHI-free global control plane** (routing, policy, tenant registry, AI governance metadata).

Success is measured by:

1. **Lawful cross-border and cross-network exchange** with default data residency in the home jurisdiction.
2. **Interoperability** on FHIR R4, US Core, USCDI, and EHDS / TEFCA-aligned patterns.
3. **Demonstrable alignment** with FedRAMP High baseline (410 controls), GDPR, and the EU AI Act — with explicit scope discipline (architecture toward authorization, not certification by code alone).

---

## Users and stakeholders

| Actor | Need |
|-------|------|
| **Clinicians** | Minimum-necessary patient data at point of care, including cross-border encounters (EU) and QHIN-mediated exchange (US) |
| **Patients** | Consent, transparency, erasure rights, EHDS primary/secondary use controls |
| **National Contact Points (EU)** | Federated identity resolution to home jurisdiction MPI |
| **Qualified Health Information Networks (US)** | TEFCA-facilitated FHIR exchange among US entities |
| **Tenant operators** | Multi-tenant isolation, auditability, regional deployment |
| **Compliance / security** | Residency evidence, policy-as-code, ATO-ready documentation |
| **AI system operators** | Governance for **high-risk AI components only** (not deterministic routing) |

---

## Tri-regime scope

Cloud Healthcare Exchange targets **simultaneous alignment** with three regulatory frames. None is satisfied by software alone; each requires organizational process and, where applicable, formal authorization.

### United States — FedRAMP High baseline

| In scope | Out of scope (clarification) |
|----------|------------------------------|
| Architecture toward **NIST SP 800-53 Rev 5 High** (410 controls) via FedRAMP baseline | Claiming FedRAMP High **authorization** without agency ATO |
| **SA-9(5)** — processing, storage, and service location in **US jurisdiction** for High-impact data | **US-person citizenship** as a FedRAMP requirement (not a government-wide rule; agency-specific add-ons may apply) |
| Continuous monitoring, incident response, personnel screening as **ATO path** obligations | Program/20x High shortcut (not available today for full High) |
| TEFCA QHIN patterns; SSRAA for new FHIR nodes (2027-01-01) | Production GovCloud deployment in reference slice |

### European Union — GDPR + EHDS

| In scope | Out of scope (clarification) |
|----------|------------------------------|
| Default **no cross-border PHI**; data remains in EU jurisdiction cell | EU-wide master patient index (does not exist) |
| Lawful basis, purpose limitation, minimization, erasure | Unqualified reliance on **EU-US Data Privacy Framework** (fragile post-2026 litigation) |
| EHDS hooks: MyHealth@EU (primary), HealthData@EU / secure processing (secondary, opt-out) | Full EHDS secondary-use platform in reference slice |
| SCCs + TIA + exporter-held keys when transfer is unavoidable | Routine cross-bloc PHI flows |

### EU AI Act

| In scope | Out of scope (clarification) |
|----------|------------------------------|
| Governance layer for **actual AI features** (triage, risk scoring, etc.) | Treating the exchange platform itself as a high-risk AI system |
| Art. 50 transparency labeling; human oversight gates for AI decisions | Full conformity assessment / Notified Body process |
| Activity logging and traceability for AI components | Watermarking infrastructure in PoC |

**Deterministic** record linkage, routing, and policy enforcement are **outside** EU AI Act high-risk scope.

---

## Core product principles

1. **Sovereignty by cell** — PHI, keys, and primary audit streams stay in the jurisdiction cell unless law and policy explicitly permit otherwise.
2. **Global plane is config-only** — No PHI in the global control plane (routing tables, tenant registry, policy bundles, AI model registry metadata).
3. **Policy-as-code** — Residency, purpose, consent, and minimum-necessary rules enforced at the Policy Enforcement Point (PEP) via OPA (Rego).
4. **Federated identity** — Resolve patients via home jurisdiction (NCP→NCP, IHE PDQm / `$match`); no fictional global MPI.
5. **Honest erasure** — Crypto-shred at **region/tenant** granularity on stock HAPI; per-subject shred only where search trade-offs are accepted.
6. **Audit realism** — Sectoral retention obligations may require identifiable audit records; pseudonymize where permitted, do not claim zero identifiers.
7. **Verify before claim** — Hermetic `verify.sh` for CI; compose E2E in `demo.sh` only.

---

## Reference slice vs target state

| | Reference slice (PoC) | Target state |
|---|----------------------|--------------|
| Cells | EU + US cells in compose; single global gateway routes to both | Per-cell region gateways in mesh |
| FHIR | HAPI R4 + US Core samples | Full USCDI / EHDS coverage |
| Policy | OPA HTTP + **OPAL consent sync (PoC)** | OPA Envoy `ext_authz` + hardened OPAL |
| Keys | Software KMS stand-in | HSM / cloud KMS per region |
| AI gov | FastAPI stub | Production model registry + incident reporting |
| Auth | SSRAA stub + stub tenants | Full SSRAA / UDAP, EHDS identity |

---

## Non-goals (this program increment)

- FedRAMP ATO, GDPR DPA sign-off, or Notified Body conformity
- Production Kubernetes, service mesh, Terraform/GovCloud
- Cross-bloc PHI as the headline demo flow
- Per-patient crypto-shred on unmodified HAPI search indexes

---

## Related documents

| Document | Purpose |
|----------|---------|
| [plan.md](plan.md) | Implementation plan, fleet gates, todos |
| [architecture/overview.md](architecture/overview.md) | System architecture |
| [architecture/compliance-mapping.md](architecture/compliance-mapping.md) | Control and legal mapping |
| [roadmap.md](roadmap.md) | Regulatory deadlines and delivery phases |
| [adr/](adr/) | Architecture decision records |
