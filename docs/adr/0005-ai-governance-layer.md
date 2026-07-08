# ADR 0005: AI Governance Layer

**Status:** Accepted  
**Date:** 2026-07-08  
**Product:** Cloud Healthcare Exchange

## Context

The EU AI Act imposes obligations on **high-risk AI systems** (Annex III standalone from 2027-12-02; Annex I embedded medical-device AI from 2028-08-02). Art. 50 transparency applies from **2026-08-02**.

Cloud Healthcare Exchange includes optional **AI-assisted features** (e.g., triage scoring). The **exchange core** (routing, deterministic FHIR reads, OPA policy) is **not** an AI system under the Act.

## Decision

Implement a separate **AI governance service** (`services/ai-governance`, Python/FastAPI):

| Capability | Purpose |
|------------|---------|
| **Model registry** | Versioned models, intended use, risk classification |
| **Decision log** | Immutable inference records (who, when, input hash, output) |
| **Human oversight gate** | Block release until clinician approves high-risk outputs |
| **Art. 50 transparency flag** | Mark AI-generated content for UI display |

Gateway invokes this layer **only** for AI feature endpoints — not standard FHIR proxy traffic.

### Out of PoC scope

- EU database registration
- 15-day serious incident reporting workflow
- Full technical documentation package for Notified Body
- Watermarking (grace to 2026-12-02 for some systems)

## Consequences

**Positive**

- Clear scope boundary for AI Act assessments.
- Python ecosystem fits ML model integration later.

**Negative**

- Additional service to operate.
- Risk of scope creep if all logic labeled "AI"

## Policy

Any new feature must be classified:

| Type | AI governance |
|------|---------------|
| Deterministic transform / route | No |
| ML model inference affecting clinical decisions | Yes |

## References

- REF-AI-01 through REF-AI-06
- [compliance-mapping.md](../architecture/compliance-mapping.md)
