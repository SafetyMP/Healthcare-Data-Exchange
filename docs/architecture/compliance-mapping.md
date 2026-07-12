# Compliance Mapping — Cloud Healthcare Exchange

Maps product architecture to **FedRAMP High baseline**, **GDPR**, **EU AI Act**, **EHDS**, and **TEFCA** requirements. This is a **design mapping**, not evidence of compliance or authorization.

**Product:** Cloud Healthcare Exchange

---

## Mapping legend

| Symbol | Meaning |
|--------|---------|
| **Arch** | Addressed by architecture / reference slice |
| **Proc** | Requires organizational process (not code-only) |
| **Phase** | Planned future increment |
| **N/A** | Out of scope or not applicable to component |

---

## FedRAMP High baseline (410 controls)

**Framing:** Architect toward High baseline; pursue **ATO** via sponsoring agency. **SA-9(5)** drives US cell placement.

| Theme | Representative controls | How Cloud Healthcare Exchange addresses |
|-------|-------------------------|----------------------------------------|
| **Data location** | SA-9(5) | US cell: all High-impact PHI processing/storage in US jurisdiction |
| **Access control** | AC-* | OPA policy at PEP; RBAC/ABAC in Rego; SSRAA/UDAP (Phase) |
| **Audit** | AU-* | Regional audit sinks; ATNA-aligned events (Proc + Arch) |
| **Encryption** | SC-12, SC-28 | Envelope encryption; KMS per region (Arch); HSM (Phase) |
| **Continuous monitoring** | CA-7, SI-* | ConMon hooks (Proc); structured audit export (Arch) |
| **Personnel** | PS-* | Screening (Proc) — **not** US-citizenship-by-default |

### Corrected assumptions (dropped)

| Wrong claim | Correction |
|-------------|------------|
| FedRAMP High requires US-person staff | **False** government-wide; agency-specific rules may add constraints |
| Software equals FedRAMP High | **ATO** + 3PAO assessment required |

---

## GDPR

| Requirement | Design response | Evidence type |
|-------------|-----------------|---------------|
| **Art. 5** — principles | Purpose limitation via OPA `policy/authz.rego`; minimization at PEP | Arch |
| **Art. 6** — lawful basis | Consent + treatment legal bases in policy input | Arch |
| **Art. 9** — special categories | Health data stays in cell; strict cross-border default deny | Arch |
| **Art. 17** — erasure | Region/tenant crypto-shred; HAPI limits documented (ADR 0003) | Arch + honest limits |
| **Art. 25** — PbD | Policy-as-code; separate DBs per jurisdiction | Arch |
| **Art. 32** — security | Encryption, access control, regional isolation | Arch |
| **Art. 35** — DPIA | Required for high-risk processing (Proc) | Proc |
| **Chapter V transfers** | Default no PHI export; SCC+TIA if exception; **DPF not relied upon** | Arch |

### DPF risk register

Post-*Trump v. Slaughter* (2026-06-29), EU-US DPF adequacy is **legally contested**. Design stance:

- **Do not** list DPF as primary transfer mechanism.
- **Do** document Schrems III / CJEU appeal as ongoing risk.
- **Strengthen** in-cell processing and pseudonymous derivatives.

---

## EU AI Act

**Status:** Adopted (Council 2026-06-29); awaiting Official Journal publication.

| Obligation | Applies to | Cloud Healthcare Exchange response |
|------------|------------|-----------------------------------|
| **Art. 50 transparency** (2026-08-02) | AI outputs shown to users | `ai-governance` Art. 50 flag on AI feature responses |
| **High-risk AI** (Annex III, 2027-12-02) | AI triage, diagnostic support, etc. | Risk mgmt, logging, human oversight in AI layer |
| **Embedded device AI** (Annex I, 2028-08-02) | Medical device software | N/A unless product scope expands |
| **Deterministic routing** | Exchange core | **Out of AI Act scope** |

Scope discipline: the **exchange platform** is not classified as an AI system; only **optional AI features** invoke the governance layer.

---

## EHDS

| EHDS element | Mapping |
|--------------|---------|
| **MyHealth@EU** (primary use) | Intra-EU demo flow; NCP→NCP via identity broker |
| **HealthData@EU** (secondary) | Phase — secure processing environment, opt-out |
| **Cross-border identity** | IHE PDQm ITI-78, ITI-119 `$match` (ADR 0006) |
| **Implementing acts** | Roadmap milestone 2027-03-26 |

---

## TEFCA / US exchange

| Element | Mapping |
|---------|---------|
| **QHIN** must be US entity | US cell operated by US tenant |
| **Facilitated FHIR** | US Core + USCDI profiles (ADR 0004) |
| **SSRAA** (2027-01-01 new nodes) | Authentication target (Phase) |
| **US residency** | SA-9(5) aligned US cell |

---

## Audit vs erasure (reconciled)

| Claim | Reality |
|-------|---------|
| Zero patient identifiers in audit | **Unrealistic** for ATNA-style health exchange (~10 year retention) |
| **Design** | Separate legal bases: audit retention vs erasure; pseudonymize where permitted; crypto-shred for data plane, not necessarily all audit rows |

---

## Cross-bloc exchange (exception path)

**Not the primary demo.** When unavoidable:

1. Policy explicitly permits purpose + legal basis.
2. Minimum-necessary derivative only — raw PHI does not leave home cell.
3. SCC + TIA documented (Proc).
4. Exporter-held keys remain in EEA for EU-origin data.

---

## Compliance evidence matrix (reference slice)

| Claim | Reference slice proves | Does not prove |
|-------|------------------------|----------------|
| Residency enforcement | OPA deny + gateway routing | GovCloud deployment |
| Consent gating | Rego + demo scenario | Legal sign-off |
| Region erasure | Key destruction demo | Per-patient HAPI shred |
| AI oversight | Human gate on stub model | Notified Body conformity |
| FedRAMP alignment | SA-9(5) architectural split | ATO |

---

## Related documents

- [product-mandate.md](../product-mandate.md)
- [data-flows.md](data-flows.md)
- [references.md](../references.md)
- [roadmap.md](../roadmap.md)
