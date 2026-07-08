# Data Flows — Cloud Healthcare Exchange

**Product:** Cloud Healthcare Exchange  
**Primary demo:** Intra-EU (MyHealth@EU-style)  
**Secondary:** US TEFCA path  
**Exception:** Cross-bloc derivative (labeled, policy-gated)

---

## Flow 1 — Intra-EU primary (visiting clinician, home data)

EU clinician treats patient whose records live in **home member state**. Data never leaves home cell; visiting clinician receives minimum-necessary response via brokered route.

```mermaid
sequenceDiagram
  participant C as Clinician (visiting MS)
  participant R as Jurisdiction Router
  participant B as Identity Broker
  participant G as Home EU Gateway
  participant O as OPA PDP
  participant F as HAPI FHIR (home)
  participant K as Key Custody
  participant A as Audit Sink

  C->>R: GET Patient (identifier + purpose=treatment)
  R->>B: Resolve home jurisdiction
  B-->>R: cell=eu-home
  R->>G: Forward (no PHI in router logs)
  G->>O: input(subject, purpose, consent, requester)
  O-->>G: allow + min_necessary_fields
  G->>F: FHIR read (in-region)
  F->>K: decrypt envelope (in-region)
  F-->>G: Patient bundle
  G->>A: audit(event, pseudonymized where possible)
  G-->>C: filtered FHIR response
```

**Compliance hooks:** GDPR Art. 5 minimization, Art. 9; EHDS primary use; no Chapter V transfer (data stayed home).

---

## Flow 2 — Consent denied

```mermaid
sequenceDiagram
  participant C as Clinician
  participant G as EU Gateway
  participant O as OPA PDP
  participant A as Audit Sink

  C->>G: Request with purpose=research
  G->>O: evaluate consent + purpose
  O-->>G: deny (no valid consent)
  G->>A: audit(deny)
  G-->>C: 403 + policy reason (no PHI)
```

---

## Flow 3 — US TEFCA (secondary demo)

US clinician accesses US patient via QHIN. All processing in **US cell** (SA-9(5)).

```mermaid
sequenceDiagram
  participant Q as QHIN Client
  participant R as Router
  participant G as US Gateway
  participant O as OPA PDP
  participant F as HAPI FHIR US

  Q->>R: US patient query
  R->>G: route cell=us
  G->>O: policy check
  O-->>G: allow
  G->>F: FHIR read
  F-->>G: US Core bundle
  G-->>Q: response
```

---

## Flow 4 — Cross-bloc exception (not headline)

EU-origin patient; **minimum-necessary derivative** requested by US requester. Raw PHI does **not** leave EU cell.

```mermaid
sequenceDiagram
  participant U as US Requester
  participant R as Router
  participant G as EU Gateway
  participant O as OPA PDP
  participant F as HAPI FHIR EU

  Note over U,F: Exception path — explicit policy + legal basis only
  U->>R: derivative request (e.g. summarized labs)
  R->>G: route to EU cell
  G->>O: cross_bloc + SCC_flag + purpose
  alt policy deny
    O-->>G: deny
    G-->>U: 403
  else policy allow
    O-->>G: allow derivative schema only
    G->>F: read + transform in-region
    F-->>G: derivative payload
    G-->>U: derivative only (no raw PHI export)
  end
```

**Risk:** EU→US Article 9 transfer — DPF not default; SCC+TIA required (Proc).

---

## Flow 5 — Region/tenant erasure (crypto-shred)

```mermaid
sequenceDiagram
  participant Admin as Tenant Admin
  participant G as EU Gateway
  participant K as Key Custody
  participant F as HAPI FHIR EU

  Admin->>G: erasure request (tenant scope)
  G->>K: destroy tenant master key
  K-->>G: key destroyed
  Note over F: ciphertext blobs unreadable;<br/>indexes may retain searchable metadata (ADR 0003)
  G-->>Admin: erasure complete (scope documented)
```

---

## Flow 6 — AI feature with human oversight

Applies only when clinician invokes an **AI-assisted** feature (not standard FHIR read).

```mermaid
sequenceDiagram
  participant C as Clinician
  participant G as Gateway
  participant AI as AI Governance
  participant M as Model (stub)

  C->>G: AI triage request
  G->>AI: register decision context
  AI->>M: infer
  M-->>AI: score + explanation
  AI-->>G: pending (human_oversight_required)
  G-->>C: provisional result + Art.50 label
  C->>AI: approve / reject
  AI-->>G: final decision logged
  G-->>C: released or blocked output
```

---

## Data classification by plane

| Data type | Global plane | EU cell | US cell |
|-----------|--------------|---------|---------|
| FHIR Patient/Observation | Never | Yes | Yes |
| Tenant routing config | Yes | Replica | Replica |
| OPA policy bundles | Metadata only | Full eval in-region | Full eval in-region |
| AI model weights | Registry metadata | Inference in-region | Inference in-region |
| Audit with patient ID | Never raw export | Regional sink | Regional sink |

---

## Related documents

- [overview.md](overview.md)
- [compliance-mapping.md](compliance-mapping.md)
- [../adr/0006-patient-identity-matching.md](../adr/0006-patient-identity-matching.md)
