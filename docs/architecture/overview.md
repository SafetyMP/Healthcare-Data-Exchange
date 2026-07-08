# Architecture Overview — Cloud Healthcare Exchange

**Product:** Cloud Healthcare Exchange  
**Version:** 0.1 (design authority)  
**See also:** [compliance-mapping.md](compliance-mapping.md), [data-flows.md](data-flows.md)

---

## Problem statement

Health data exchange must span organizations and jurisdictions while respecting **conflicting legal regimes**: US federal cloud security (FedRAMP High baseline), EU GDPR and EHDS, and EU AI Act obligations for AI-assisted clinical features. A single global database fails sovereignty, erasure, and transfer rules.

Cloud Healthcare Exchange solves this as a **federation of jurisdiction cells** joined by a **PHI-free control plane**.

---

## Logical architecture

```mermaid
flowchart TB
  subgraph clients [Clients]
    EUClin[EU Clinician / NCP client]
    USClin[US Clinician / QHIN client]
  end

  subgraph global [Global Control Plane — no PHI]
    Router[Jurisdiction Router]
    Registry[Tenant + Policy Registry]
    IdBroker[Identity Broker]
    AIGov[AI Governance Registry]
  end

  subgraph eu [EU Jurisdiction Cell]
    EGW[Region Gateway] --> EPEP[PEP] --> EOPA[OPA PDP]
    EPEP --> EFHIR[HAPI FHIR + Postgres]
    EFHIR --> EKMS[Key Custody EU]
    EGW --> EAudit[Audit Sink EU]
  end

  subgraph us [US Jurisdiction Cell — target]
    UGW[Region Gateway] --> UPEP[PEP] --> UOPA[OPA PDP]
    UPEP --> UFHIR[HAPI FHIR + Postgres]
    UFHIR --> UKMS[Key Custody US]
    UGW --> UAudit[Audit Sink US]
  end

  EUClin --> Router
  USClin --> Router
  Router --> IdBroker
  IdBroker --> EGW
  Router --> UGW
  Registry -.-> Router
  AIGov -.-> EGW
  AIGov -.-> UGW
```

### Planes

| Plane | Contents | PHI |
|-------|----------|-----|
| **Global control** | Routing, tenants, policy bundles, AI model registry metadata, identity broker state (pseudonymous routing tokens) | No |
| **Regional data** | FHIR resources, Postgres, regional keys, regional audit | Yes (in-region) |

---

## Components

### Jurisdiction router (Go)

- Terminates client requests (TLS, authn stub → SSRAA/UDAP in production).
- Selects target cell from tenant config and patient home jurisdiction.
- Delegates authorization to regional PEP; never caches PHI in global memory.

### Policy Enforcement Point (Go, in-region)

- Calls OPA with structured input: subject, purpose, consent flags, resource type, requester jurisdiction.
- Enforces **minimum necessary** response shaping (field filtering).
- Emits audit events to regional sink.

### OPA (Rego PDP)

- Evaluates `policy/residency.rego`, `consent.rego`, `purpose.rego`.
- PoC: sidecar container, HTTP API from gateway.
- Target: Envoy `ext_authz` sidecar; OPAL for consent revocation sync.

### FHIR data plane (HAPI + Postgres)

- One database per jurisdiction cell (separate-DB isolation).
- US Core profiles for US cell; EU profiles for EU cell in target state.
- Search indexes (`HFJ_SPIDX_*`) constrain erasure granularity (see ADR 0003).

### Key custody

- Envelope encryption with region/tenant master keys.
- PoC: software KMS stand-in representing Cloud KMS / Key Vault / CloudHSM.

### AI governance (Python/FastAPI)

- Model registry, inference decision log, human-oversight gate, Art. 50 transparency flag.
- Applies only when gateway invokes an **AI feature** — not for deterministic reads.

### Identity broker

- Federated lookup: route to home NCP / regional MPI via identifier or constrained `$match`.
- No EU-wide MPI (ADR 0006).

---

## Reference slice (walking skeleton)

Phase 1 delivers **one EU cell**:

| Service | Role |
|---------|------|
| `gateway` | Router + PEP |
| `opa` | PDP |
| `hapi-eu` + `postgres-eu` | Data plane |
| `ai-governance` | AI stub |

Phase 2 adds US cell and cross-bloc **exception** path (documented, not headline demo).

---

## Deployment targets

| Environment | Orchestration |
|-------------|---------------|
| Local dev | `docker-compose` via `scripts/run-dev.sh` |
| Production target | Kubernetes, GitOps, service mesh (mTLS), Kyverno admission, OPA `ext_authz` |

Out of scope for reference slice: Terraform, GovCloud, multi-region K8s.

---

## Security boundaries

```mermaid
flowchart LR
  subgraph trust [Trust boundaries]
    Internet[Internet / QHIN / NCP]
    Global[Global control — low PHI trust]
    Regional[Regional cell — high PHI trust]
    Data[Postgres + keys]
  end
  Internet -->|mTLS + auth| Global
  Global -->|route only| Regional
  Regional --> Data
```

- **Fail closed:** PDP deny → no FHIR read.
- **Default deny cross-border PHI** — derivatives only with explicit policy path.
- **Secrets:** never in repo; `protect-secrets` hook blocks `.env` reads in agent sessions.

---

## Related ADRs

| ADR | Topic |
|-----|-------|
| [0001](../adr/0001-jurisdiction-cells.md) | Jurisdiction cells |
| [0002](../adr/0002-policy-opa-cedar.md) | OPA + Cedar notes |
| [0003](../adr/0003-key-custody-crypto-shred.md) | Keys and erasure |
| [0004](../adr/0004-fhir-us-core-interop.md) | FHIR / US Core |
| [0005](../adr/0005-ai-governance-layer.md) | AI governance |
| [0006](../adr/0006-patient-identity-matching.md) | Patient identity |
