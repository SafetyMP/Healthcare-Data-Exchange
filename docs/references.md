# References — Cloud Healthcare Exchange

Authoritative external sources cited in mandate, architecture, and ADRs. Verify URLs periodically; regulatory status changes.

---

## FedRAMP and US federal

| ID | Source | Use in this project |
|----|--------|---------------------|
| REF-FED-01 | [FedRAMP Help Center](https://help.fedramp.gov/hc/en-us) | No government-wide US-person citizenship requirement |
| REF-FED-02 | NIST SP 800-53 Rev 5 **SA-9(5)** — External System Services (location) | US jurisdiction for High-impact data processing/storage |
| REF-FED-03 | [FedRAMP High baseline](https://www.fedramp.gov/) (410 controls) | Architecture alignment target |
| REF-FED-04 | [TEFCA / RCE](https://www.healthit.gov/topic/interoperability/trusted-exchange-framework-and-common-agreement-tefca) | US QHIN exchange patterns |
| REF-FED-05 | SSRAA (ONC) — standards-based app association | FHIR node authentication (2027-01-01 deadline) |

---

## GDPR and EU data protection

| ID | Source | Use in this project |
|----|--------|---------------------|
| REF-EU-01 | GDPR Articles 5, 6, 9, 17, 25, 32, 35 | Lawfulness, special categories, erasure, DPIA |
| REF-EU-02 | EDPB guidance on international transfers | SCC + TIA; DPF not default |
| REF-EU-03 | *Trump v. Slaughter*, US Supreme Court (2026-06-29) | DPF institutional fragility |
| REF-EU-04 | noyb “Schrems III” announcement; *Latombe* CJEU appeal | DPF risk register |
| REF-EU-05 | Hunton Andrews Kurth; Fieldfisher analyses (2026) | DPF post-ruling commentary |

---

## EHDS and cross-border health (EU)

| ID | Source | Use in this project |
|----|--------|---------------------|
| REF-EHDS-01 | Regulation (EU) 2025/327 — European Health Data Space | Primary/secondary use framework |
| REF-EHDS-02 | [MyHealth@EU / eHDSI](https://health.ec.europa.eu/ehealth-digital-health-and-care/digital-health-and-care/electronic-cross-border-health-services_en) | NCP federated access |
| REF-EHDS-03 | IHE ITI-78 (PDQm), ITI-119 (`$match`) | Patient identity resolution |
| REF-EHDS-04 | IHE ATNA — audit trail patterns | Audit retention vs erasure tension |
| REF-EHDS-05 | MyHealth@EU AI Act tutorial; PMC sectoral retention | Identifiers in audit logs |

---

## EU AI Act

| ID | Source | Use in this project |
|----|--------|---------------------|
| REF-AI-01 | Regulation (EU) 2024/1689 — Artificial Intelligence Act | High-risk AI obligations |
| REF-AI-02 | Council adoption (2026-06-29); Parliament (2026-06-16) — Digital Omnibus package | **Adopted** status (awaiting OJ) |
| REF-AI-03 | Art. 50 — transparency (2026-08-02) | Labeling / disclosure |
| REF-AI-04 | Annex III standalone high-risk (2027-12-02) | Timeline |
| REF-AI-05 | Annex I embedded medical-device AI (2028-08-02) | Timeline |
| REF-AI-06 | JDSupra; Gibson Dunn summaries (2026) | Date confirmation |

---

## Interoperability and standards

| ID | Source | Use in this project |
|----|--------|---------------------|
| REF-INT-01 | HL7 FHIR R4 | Data plane API |
| REF-INT-02 | [US Core IG](https://hl7.org/fhir/us/core/) 6.1.0 | US profiles |
| REF-INT-03 | USCDI | Required data classes |
| REF-INT-04 | FHIR Provenance | Audit lineage |
| REF-INT-05 | [HAPI FHIR](https://hapifhir.io/) | Reference server; `HFJ_SPIDX_*` search index behavior |
| REF-INT-06 | [OPA](https://www.openpolicyagent.org/) / Rego | Policy engine |
| REF-INT-07 | [Cedar](https://www.cedarpolicy.com/) | Noted for entity authz (ADR 0002) |
| REF-INT-08 | OPAL — policy sync | Consent revocation propagation (target state) |

---

## Internal project documents

| Document | Path |
|----------|------|
| Implementation plan | [plan.md](plan.md) |
| Product mandate | [product-mandate.md](product-mandate.md) |
| Architecture | [architecture/](architecture/) |
| ADRs | [adr/](adr/) |
| Roadmap | [roadmap.md](roadmap.md) |
