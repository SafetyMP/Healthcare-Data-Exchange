# Glossary — Healthcare Data Exchange

Terms used by the guided demo and its separate reference backend. The
[product mandate](product-mandate.md) defines scope; the [architecture](architecture/overview.md)
explains the two execution modes.

| Term | Meaning in this project |
|---|---|
| **Healthcare Data Exchange** | The current project name: a guided synthetic browser demonstration and a separate backend reference implementation. |
| **Synthetic patient** | One of four fictional fixture records; never a real patient's information. |
| **Guided walkthrough** | Nine checkpoints using the real demo forms to compare consent, regional restrictions, limited responses and Activity. |
| **Checkpoint** | A guided step completed through matching form actions; some steps require both a consent save and a subsequent access check. |
| **Purpose of access** | Treatment, Research or Limited derivative; each selects a separate consent preference in the demo. |
| **Requesting team / requester preset** | A selectable demo caller context used by the browser simulation. It does not authenticate the visitor. |
| **Consent management** | The demo form for granting or revoking one synthetic patient's preference for one purpose. |
| **Regional restriction** | A fixture policy that compares the selected caller region and patient's home region. It is not evidence of physical data location. |
| **Limited derivative** | The explicitly permitted cross-region example returning only `id` and `resourceType`; not anonymous data or a clinical summary. |
| **Activity** | Recent simulated decisions and changes recorded in the current browser tab, not a production audit log. |
| **Session storage** | Browser storage used to retain tab-local state through reloads. When unavailable, the demo uses page memory and cannot promise reload persistence. |
| **Reset demo** | Restore initial synthetic consent and clear Activity, selected context and walkthrough progress. |
| **Identity matching** | Lookup of a configured preferred identifier or sample record ID; matching alone grants no access. |
| **AI oversight example** | Fixed output held for human review. The browser runs no clinical model and offers no approval/rejection action. |
| **Reference backend** | The separately run Go gateway, OPA/OPAL, HAPI FHIR, Postgres and supporting Python services. Browser simulation results do not verify this stack. |
| **Cell** | One logical EU or US HAPI/Postgres partition in the local reference stack; not a certified regional deployment. |
| **FHIR** | HL7 Fast Healthcare Interoperability Resources. The reference stack uses FHIR R4 Patient fixtures. |
| **HAPI FHIR** | The FHIR server used by the backend's two reference cells. |
| **OPA / PDP** | Open Policy Agent, the backend policy decision point evaluating Rego rules. |
| **PEP** | Policy enforcement point: the gateway enforces the backend decision and filters returned fields. |
| **Rego** | The policy language used in `policy/authz.rego`. |
| **OPAL** | The backend policy/data distribution component used for consent propagation. It does not run in the browser demo. |
| **Verified caller principal** | Backend requester identity derived from a validated per-cell demo credential, not a query parameter. |
| **SSRAA stub** | The reference US caller-authentication mechanism. It is not full production UDAP/SSRAA federation. |
| **Key shred demonstration** | A reference software key-lifecycle scenario; it does not prove all HAPI data, indexes or backups have been erased. |
| **ADR** | Architecture decision record. ADRs preserve decisions and proposed targets; their presence does not prove implementation or validation. |
| **PHI** | Protected health information, a US terminology used in historical design documents. Real health data is outside this project's demo scope. |
| **ATO** | Authorization to operate. This project makes no ATO claim. |
| **Cloud Healthcare Exchange** | Historical project name retained in older design documents, source identifiers and evidence. |

## Historical terminology

The [original glossary at revision bae1c21](https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/bae1c21d9b3bbb5faf98d660ea39bf68d44f9e34/docs/glossary.md)
preserves the broader regulatory and target-architecture vocabulary, including
NCP, QHIN, MPI, SCC, TIA, EHDS and FedRAMP. Its dated legal interpretations and
deadlines have not been revalidated here. See [references](references.md) for the
historical bibliography; these terms do not imply current integrations or compliance.
