# Security Policy

## Supported versions

| Version | Receives fixes |
|---|---|
| Latest `main` | Yes |

Healthcare Data Exchange is an actively developed synthetic demo and reference
implementation. This support policy is not a production-security guarantee.

## Report a vulnerability privately

**Do not open a public GitHub issue for a security vulnerability.**

Use [GitHub private vulnerability reporting](https://github.com/SafetyMP/Healthcare-Data-Exchange/security/advisories/new).
If that option is unavailable, contact the maintainers through GitHub without posting
exploit details or secrets publicly.

Include the affected commit, mode and paths; impact; steps using synthetic data;
and a suggested fix if available. Identify whether the issue affects the browser
simulation, frontend gateway proxy, backend service, policy, deployment or build process.
Do not attach real patient records, bearer tokens, administrator tokens or local secrets.

We aim to acknowledge reports within a reasonable timeframe. This volunteer-maintained
project has no formal response SLA.

## Two modes, different boundaries

- **Hosted browser demo:** the guided walkthrough uses fictional records and browser-local
  simulated decisions. It makes no gateway API requests and does not prove live policy
  enforcement. Editing local demo state is not a bypass of the reference backend.
- **Reference backend and live-gateway frontend:** authorization comes from verified
  caller credentials, purpose, consent and regional policy. Query parameters must not
  become a substitute for verified identity. Report failures in those boundaries privately.
- **Synthetic data only:** do not introduce real PHI into the app, samples, issues, PRs
  or demonstrations.
- **Local secrets stay local:** never commit `.env`, `deploy/opal/dev-secrets.env`,
  `deploy/opal/keys/`, or other credentials. Do not run this stack as-is for regulated workloads.

## Explicit limitations

The reference backend is not production hardened. The
[threat model](docs/adr/0000-threat-model.md), [roadmap](docs/roadmap.md) and
[OPAL hardening profile](config/opal-hardening.yaml) distinguish implemented controls
from gaps. Known limitations include:

- One global gateway in the PoC rather than the per-cell target architecture.
- Demonstrative shared-secret requester credentials rather than production SSRAA/UDAP
  or EHDS credentials.
- Unsigned OPAL bundles (`signed_bundles: false`), no OPAL server/client mTLS, and no
  HSM-backed OPAL authentication keys.
- Consent-service `/policy-data` relies on internal-network trust in the PoC.
- No FedRAMP ATO, GDPR certification or clinical-readiness claim.
  [Compliance mapping](docs/architecture/compliance-mapping.md) is design documentation.

## Safe harbor

We appreciate responsible disclosure. Researchers who follow this policy and avoid
privacy violations (real PHI, unauthorized access to third-party systems) will not be
pursued for good-faith security research on this repository's intended local/demo deployment.
