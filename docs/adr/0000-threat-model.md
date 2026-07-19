# ADR 0000: Threat Model — Caller, Trust Boundary, Authentication

**Status:** Accepted  
**Date:** 2026-07-13  
**Product:** Cloud Healthcare Exchange

## Context

CHEX serves EU and US jurisdiction cells with distinct residency rules. Cooperative `./scripts/demo.sh` validates expected product flows; it does not replace an adversarial oracle. Every patient read must derive requester identity from **verified per-cell credentials** (ADR 0009), not query parameters or subject home metadata.

Machine-readable cells: `specs/threat-model.yaml`. Tier-3 negative tests: `scripts/adversarial.sh` (separate from demo).

## Decision

### Principals (who is the caller)

| Principal | Auth kind | Cell | May read |
|-----------|-----------|------|----------|
| `anonymous` | none | none | nothing on `/v1/patients/*` |
| `eu_home_bearer` | `eu-bearer` | EU | EU-home subjects (policy permitting) |
| `eu_visiting_bearer` | `eu-bearer` | EU | EU subjects (policy permitting) |
| `us_clinician_bearer` | `us-ssraa` | US | US-home subjects; cross-bloc only on permitted derivative purpose |
| `us_ssraa_bearer` | `us-ssraa` | US | US-home subjects with valid SSRAA association |
| `admin_bearer` | admin secret | control plane | admin routes only |

### Trust boundaries

| Boundary | Routes | Enforcement | Failure |
|----------|--------|-------------|---------|
| **Authentication** | `GET /v1/patients/{id}` | `principal.Broker` before OPA | `401 credential_required` or `401 ssraa_required` |
| **Cell residency** | patient reads | OPA after principal resolution | `403 residency_denied` |
| **Purpose / consent** | patient reads (`purpose=research`) | OPA `data.consent` | `403 consent_required` (no consent or after revoke) |
| **Query param override** | patient reads | ignored for identity | must not bypass authentication (`401`) |

### Authentication mechanisms

| Mechanism | Config | Establishment | Missing / wrong cell |
|-----------|--------|---------------|----------------------|
| EU EHDS bearer stub | `config/eu-auth.yaml` | `Authorization: Bearer {client}.{secret}` | `401 credential_required` |
| US SSRAA stub | `config/ssraa.yaml` | `Authorization: Bearer {app}.{secret}` | `401 ssraa_required` on US-home reads |
| US SSRAA on EU subject | same | verified US principal | `403 residency_denied` (not silent allow) |

### Non-goals

- Cooperative demo is not the adversarial tier.
- `requester_jurisdiction` query param must never substitute for bearer authentication.

## Consequences

**Positive**

- Adversarial CI traces each deny case to a named principal and cell.
- New routes require YAML + adversarial update before merge.

**Negative**

- ADR-0000 must stay aligned with ADR 0001, 0009, and `specs/threat-model.yaml`.

## References

- ADR 0001 (jurisdiction cells), ADR 0009 (SSRAA / EU auth stub)
- `specs/threat-model.yaml`, `scripts/adversarial.sh`
- `services/gateway/internal/principal/`
