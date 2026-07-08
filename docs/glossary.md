# Glossary — Cloud Healthcare Exchange

Terms used across architecture, ADRs, and compliance documents.

| Term | Definition |
|------|------------|
| **AI governance layer** | Control-plane service registering AI models, logging decisions, enforcing human oversight and Art. 50 transparency — scoped to **AI features**, not deterministic exchange logic. |
| **Article 9 data** | GDPR special category personal data; includes health data. |
| **ATO** | Authority to Operate — US federal authorization for a system to run in production under FedRAMP. |
| **ATNA** | IHE Audit Trail and Node Authentication; audit patterns requiring identifiable patient references in health exchange. |
| **Cell (jurisdiction cell)** | Isolated regional deployment: in-region FHIR data plane, database, keys, and audit sink. US and EU cells are separate. |
| **Cloud Healthcare Exchange** | This product — a federated multi-tenant health information exchange. |
| **ConMon** | Continuous monitoring — FedRAMP ongoing assessment requirement. |
| **Crypto-shred** | Erasure by destroying encryption keys for a scope (region/tenant in PoC); data blobs become unreadable without wiping every copy. |
| **Control plane** | Global layer: routing, tenant registry, policy distribution, AI governance registry — **no PHI**. |
| **Data plane** | In-region FHIR services and databases holding PHI. |
| **DPF** | EU-US Data Privacy Framework — adequacy mechanism; treat as **unreliable** for design defaults (2026 legal fragility). |
| **EHDS** | European Health Data Space — EU framework for primary (MyHealth@EU) and secondary health data use. |
| **Envelope encryption** | Data encrypted with per-object data keys wrapped by a region/tenant master key. |
| **FHIR** | Fast Healthcare Interoperability Resources — HL7 standard; R4 baseline for this project. |
| **HAPI FHIR** | Open-source FHIR server; used as regional data plane in reference slice. |
| **HealthData@EU** | EHDS secondary-use access pathway with opt-out. |
| **High-risk AI system** | EU AI Act category for systems listed in Annex III (and Annex I embedded) — applies to specific AI components, not the whole exchange. |
| **Identity broker** | Control-plane component routing patient lookup to home jurisdiction without a global MPI. |
| **Minimum necessary** | HIPAA/GDPR principle; return only data elements required for stated purpose. |
| **MPI** | Master Patient Index — national or organizational; **no EU-wide MPI**. |
| **MyHealth@EU** | EHDS primary-use cross-border patient access via National Contact Points. |
| **NCP** | National Contact Point — EU node for cross-border health data access. |
| **OPA** | Open Policy Agent — policy engine evaluating Rego rules at the PEP. |
| **PEP** | Policy Enforcement Point — gateway component enforcing PDP decisions. |
| **PDP** | Policy Decision Point — OPA in this architecture. |
| **PHI** | Protected Health Information (US HIPAA framing); overlaps with GDPR health data. |
| **PoC** | Proof of concept — reference slice in this repo. |
| **QHIN** | Qualified Health Information Network — US TEFCA participant. |
| **Rego** | OPA policy language. |
| **SA-9(5)** | FedRAMP control restricting High-impact data location to US jurisdiction. |
| **SCC** | Standard Contractual Clauses — GDPR transfer mechanism. |
| **SSRAA** | Secure, Standards-Based Application Association — US FHIR app auth framework (required 2027-01-01 for new nodes). |
| **TEFCA** | Trusted Exchange Framework and Common Agreement — US nationwide health exchange policy. |
| **TIA** | Transfer Impact Assessment — GDPR analysis for third-country transfers. |
| **US Core** | US FHIR implementation guide; version 6.1.0 referenced in plan. |
| **USCDI** | US Core Data for Interoperability — US data classes required for interoperability. |
| **Walking skeleton** | Minimal runnable one-cell stack proving core patterns before second cell. |
