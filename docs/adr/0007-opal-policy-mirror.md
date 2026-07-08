# ADR 0007: OPAL Policy-Mirror Repository

**Status:** Accepted  
**Date:** 2026-07-08  
**Product:** Cloud Healthcare Exchange

> Companion to **ADR 0008 (dynamic consent sync with OPAL)**, which covers
> fast-changing consent data. This ADR covers the **policy bundle** split and
> the `healthcare-policy` mirror repo OPAL polls for Rego.

## Context

OPA policies are slow-changing, versioned artifacts that belong in Git with
reviewable diffs and CI tests (`opa test`). OPAL is the distribution layer that
propagates policy bundles to regional PDPs without redeploying the gateway.

A single monorepo mixing application services, synthetic FHIR samples, and
policy creates two problems:

1. **OPAL consumption** — OPAL server tracks a dedicated policy repo; bundling
   unrelated paths increases leak risk and complicates bundle integrity checks.
2. **Agent boundaries** — Cursor/agents need a clear rule: edit policy here,
   mirror to `healthcare-policy`, never edit tests in the mirror.

## Decision

Split the portfolio into **canonical** (this repo) and **policy-mirror**
([healthcare-policy](https://github.com/SafetyMP/healthcare-policy)):

| Repo | Role | Contents |
|------|------|----------|
| Healthcare-Data-Exchange | canonical | `policy/*.rego` + `*_test.rego`, services, compose, docs |
| healthcare-policy | policy-mirror | `policy/*.rego` only (no tests) — OPAL git source |

Contract is declared in [specs/portfolio.yaml](../../specs/portfolio.yaml).
Sync is `./scripts/sync-policy-repo.sh` (canonical → mirror).

### OPAL wiring

- `opal-server` polls the mirror repo for policy commits.
- `opal-client` loads bundles into the embedded OPA PDP (port 8181).
- Consent **data** (not policy) is a separate OPAL data source — see ADR 0008.

### Integrity

- Bundle hash checks: `./scripts/check-policy-bundle.sh` (ADR 0011).
- Webhook trigger after sync: `./scripts/trigger-opal-policy-webhook.sh`.

## Consequences

**Positive**

- Clear separation of policy publication vs application code.
- OPAL tracks a minimal, purpose-built repo.
- Portfolio CI can cross-check mirror drift (`check-portfolio-cross-repo.sh`).

**Negative**

- Two-repo workflow; contributors must run sync before claiming OPAL is current.
- Mirror repo needs its own OSS health files and verify job.

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Policy only in mirror | Loses `opa test` co-location with gateway input shapes |
| Single repo, OPAL subpath | OPAL git source is whole-repo; subpath filtering is brittle in PoC |
| Manual policy copy | No drift detection; error-prone |

## References

- [specs/portfolio.yaml](../../specs/portfolio.yaml)
- ADR 0008 — Dynamic consent sync with OPAL
- ADR 0011 — OPAL production hardening
