# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| `main` | Yes |

This is a reference implementation under active development. Only the latest `main` branch receives fixes.

## Reporting a vulnerability

**Please do not open public GitHub issues for security vulnerabilities.**

Use [GitHub private vulnerability reporting](https://github.com/SafetyMP/Healthcare-Data-Exchange/security/advisories/new) for this repository, or contact the maintainers through GitHub if that option is unavailable.

Include:

- Description of the issue and potential impact
- Steps to reproduce
- Affected paths or services (gateway, OPAL, consent-service, etc.)
- Suggested fix if you have one

We aim to acknowledge reports within a reasonable timeframe. This is an open-source reference project without a formal SLA.

## Scope notes

- **No real PHI** — FHIR samples under `fhir/samples/` are synthetic. Do not use production patient data in issues, PRs, or demos.
- **Dev secrets** — `deploy/opal/dev-secrets.env` and `deploy/opal/keys/` are local-only PoC credentials. Never commit them.
- **Not production-hardened** — OPAL secure mode, SSRAA, and KMS are demonstrative stubs. Do not deploy this stack as-is for regulated workloads.

### Explicit non-claims (PoC gaps)

These are tracked in `docs/roadmap.md` Phase 4b+ and `config/opal-hardening.yaml` `gaps:` — not present in this reference stack:

- Per-cell region gateways (PoC uses one global gateway; ADR 0001 target)
- Production SSRAA/UDAP / EHDS credentials (shared-secret stubs only)
- Cosign/sigstore signed OPAL policy bundles (`signed_bundles: false`)
- mTLS between OPAL server and clients; HSM-backed OPAL auth keys
- Authenticated consent-service `/policy-data` (internal-network trust in PoC)
- FedRAMP ATO / GDPR certification evidence (`docs/architecture/compliance-mapping.md` is design mapping only)

## Safe harbor

We appreciate responsible disclosure. Researchers who follow this policy and avoid privacy violations (real PHI, unauthorized access to third-party systems) will not be pursued for good-faith security research on this repository's intended local/demo deployment.
