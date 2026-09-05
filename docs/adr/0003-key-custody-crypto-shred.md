# ADR 0003: Key Custody and Crypto-Shredding

**Status:** Accepted  
**Date:** 2026-07-08  
**Product:** Cloud Healthcare Exchange

## Context

GDPR Art. 17 erasure must be reconciled with immutable audit obligations and FHIR search requirements. Initial plan claimed **per-subject crypto-shredding** on **stock HAPI FHIR**.

HAPI persists searchable plaintext in `HFJ_SPIDX_*` index tables for FHIR search parameters. Per-subject key destruction either:

- Leaves discoverable metadata in indexes, or
- Breaks search for surviving subjects.

## Decision

### Production target

- **Envelope encryption** with hierarchy: cloud KMS master key → region/tenant data keys → object keys.
- PoC uses a **software KMS stand-in** (explicitly not production-certified).

### Erasure granularity (honest)

| Scope | Supported | Mechanism |
|-------|-----------|-----------|
| **Region / tenant** | Yes (PoC demo) | Destroy tenant or cell master key; DB may retain unreadable ciphertext |
| **Per-subject on stock HAPI** | No (default) | Index tables retain searchable PHI |
| **Per-subject (exception)** | Phase / custom | App-layer encryption of specific blobs + disable FHIR search on those elements |

Crypto-shred demonstrates **key destruction erasure** for a defined scope — not guaranteed wipe of every byte or index row.

### Audit vs erasure

Sectoral health exchange may require **ATNA-style audit** with patient identifiers retained ~10 years. Erasure requests apply to **clinical data plane** per legal analysis; audit rows may persist under separate legal basis. Pseudonymize audit where permitted — do not claim zero identifiers globally.

### Audit pseudonym (v2)

Gateway audit rows use `subject_pseudonym`, not the raw subject id.

| Version | Algorithm | Form | Notes |
|---------|-----------|------|-------|
| **v1** (pre-#16) | HMAC-SHA256(tenant AES key, subject) truncated to 16 bytes | 32 hex chars | Tenant AES key reused as MAC key; truncation reduced collision margin |
| **v2** | HMAC-SHA256(HKDF-style domain-separated MAC key, subject) | `v2:` + 64 hex chars | AES key is not reused directly; full digest; irreversible without the tenant key |

**Migration:** Existing JSONL rows keep their v1 32-hex values as historical records. They cannot be joined to v2 values. New events use `v2:`. After tenant crypto-shred, both v1 and v2 become unlinkable. Operators grepping sinks should treat length-32 hex as v1 and `v2:`-prefixed values as current.

Consent admin audit previously wrote `subject:purpose` in `detail`; that field is now `purpose=<purpose>` plus `subject_pseudonym`.

## Consequences

**Positive**

- Honest compliance narrative for auditors.
- Region-level shred matches cell architecture (ADR 0001).

**Negative**

- Cannot market "instant per-patient delete" on unmodified HAPI.
- May require Medplum or custom index strategy for finer granularity later.

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Per-subject keys on stock HAPI | Index contradiction |
| Full physical delete only | Slow; conflicts with backup/audit |
| No encryption | Fails GDPR Art. 32 and FedRAMP SC-* |

## References

- REF-INT-05 (HAPI indexes)
- REF-EHDS-04, REF-EHDS-05 (audit retention)
- [compliance-mapping.md](../architecture/compliance-mapping.md)
