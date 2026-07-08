# Roadmap — Cloud Healthcare Exchange

**Product:** Cloud Healthcare Exchange  
**Last updated:** 2026-07-08

Aligns delivery phases with **regulatory deadlines** and the [implementation plan](plan.md).

---

## Regulatory calendar

| Date | Milestone | Product impact |
|------|-----------|----------------|
| **2026-08-02** | EU AI Act **Art. 50** transparency in force | AI governance layer must label AI outputs |
| **2026-12-02** | Art. 50 watermarking grace ends | Watermarking for applicable AI systems (Phase) |
| **2027-01-01** | **SSRAA** required for new US FHIR nodes | US cell auth must support SSRAA/UDAP |
| **2027-03-26** | **EHDS** implementing acts / primary-use base | MyHealth@EU profile alignment review |
| **2027-12-02** | AI Act **Annex III** standalone high-risk | Full high-risk controls for AI triage features |
| **2028-08-02** | **Annex I** embedded medical-device AI | Only if scope includes device software |
| **2029** | EHDS primary-use expansion | Broader member-state connectivity |
| **2031** | EHDS secondary-use expansion | HealthData@EU / secure processing |

**AI Act status:** Adopted (Council 2026-06-29; Parliament 2026-06-16); awaiting Official Journal publication — dates above are not provisional.

---

## Delivery phases

### Phase 0 — Foundation (complete)

| Item | Status |
|------|--------|
| Harness solo scaffold | Done |
| `docs/plan.md` + fleet playbook | Done |
| GitHub remote | Done |

### Phase 1 — Design authority (this increment)

| Todo | Deliverable | Status |
|------|-------------|--------|
| docs-mandate | product-mandate, glossary, references | Done |
| docs-architecture | overview, compliance-mapping, data-flows | Done |
| docs-adrs | ADR 0001–0006 | Done |
| docs-roadmap | This document | Done |

**Exit criteria:** Docs merged on `main`; `./scripts/verify.sh` passes.

### Phase 2a — EU walking skeleton (serial, solo harness)

| Todo | Deliverable | Target |
|------|-------------|--------|
| slice-scaffold | 1-cell docker-compose, module stubs | Q3 2026 |
| slice-gateway-policy | Go router + OPA PEP | Q3 2026 |
| slice-region-fhir | HAPI EU + Postgres + region keys | Q3 2026 |
| slice-ai-governance | FastAPI stub | Q3 2026 |
| verify-wiring | Hermetic verify.sh; run-dev.sh; demo.sh | Q3 2026 |
| test-demo | Intra-EU demo evidence | Q3 2026 |

**Exit criteria:** `demo.sh` proves residency, consent deny, region shred, AI oversight gate.

### Phase 2b — Parallel slice (optional, **fleet harness**)

Same todos split across tracks — see [fleet gate A](plan.md#fleet-gate-a--parallel-slice-scaffold).

### Phase 3 — Second cell + exception path (complete)

| Item | Deliverable | Status |
|------|-------------|--------|
| US cell | HAPI US + Postgres (SA-9(5) placement) | **Done** |
| Cross-bloc policy | Exception flow; deny-by-default; SCC+TIA in architecture docs | **Done** |
| Identity broker | Config stub + `/v1/identity/resolve`; NCP patterns | **Stub** (Phase 4) |
| Integration | `demo.sh` US TEFCA + cross-bloc scenarios; verify green | **Done** |

**Exit criteria:** US TEFCA demo + documented cross-bloc deny-by-default — **met** on `main`.

### Phase 4a — Dynamic consent with OPAL (complete)

| Item | Deliverable | Status |
|------|-------------|--------|
| Policy repo | `SafetyMP/healthcare-policy` tracked by OPAL | **Done** |
| consent-service | Consent state + OPAL data source + publish trigger (ADR 0007) | **Done** |
| Policy | `data.consent`-driven research gate; hermetic Rego tests | **Done** |
| Demo | Live revoke/grant flips research 200↔403 with no restart | **Done** |

**Exit criteria:** `demo.sh` proves consent withdrawal propagates to the PDP at
runtime — **met**.

### Phase 4b — Production hardening (next)

| Item | Notes |
|------|-------|
| SSRAA production auth | Before 2027-01-01 (US FHIR nodes) |
| Kubernetes + mesh + `ext_authz` | ADR 0002 target |
| Identity broker | Beyond config stub; NCP / ITI-78 patterns |
| HSM KMS | Replace software stand-in |
| OPAL hardening | Auth/JWT, signed bundles, git webhooks |
| FedRAMP ATO path | Agency sponsorship (Proc) |
| EHDS secondary use | HealthData@EU |

---

## Harness profile by phase

| Phase | Profile |
|-------|---------|
| 0–1, 2a, 3 complete | **solo** |
| 2b, 3 (parallel agents) | **fleet** — [init playbook](plan.md#fleet-initialization-playbook) |

---

## Risk register (top 5)

| Risk | Mitigation |
|------|------------|
| DPF collapse / Schrems III | No cross-border PHI default; SCC+TIA |
| HAPI erasure vs search | ADR 0003 honest granularity |
| AI Act scope creep | ADR 0005 classification gate |
| Compose instability in cloud VM | Walking skeleton; demo not in verify.sh |
| FedRAMP wording overclaim | ATO framing in mandate |

---

## Related documents

- [plan.md](plan.md)
- [product-mandate.md](product-mandate.md)
- [architecture/](architecture/)
- [adr/](adr/)
