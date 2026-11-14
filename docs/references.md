# References — Healthcare Data Exchange

This index separates current implementation sources from historical design and
regulatory research. Source code explains behavior; a dated test result is needed
to establish that a particular revision was exercised successfully.

## Current project and browser sources

| Source | What to use it for |
|---|---|
| [Project overview](../README.md) and [product mandate](product-mandate.md) | Current identity, intended audience, scope and limits |
| [Web README](../web/README.md) | Browser development, demo build and verification commands |
| [Demo functions](../web/src/lib/demo.ts) | Fictional patients, consent, regional decisions, limited fields and Activity |
| [Walkthrough definitions](../web/src/lib/walkthrough.ts) | Nine checkpoints and matching action requirements |
| [Guide component](../web/src/components/walkthrough/guided-walkthrough.tsx) | Start/restart, pause/resume, navigation and checkpoint persistence |
| [API dispatch](../web/src/lib/api.ts) and [Next.js configuration](../web/next.config.ts) | Boundary between browser simulation and backend requests |
| [Web test suite](../web/tests/) | Automated scenarios; not evidence of a current passing run by itself |
| [Architecture](architecture/overview.md) and [data flows](architecture/data-flows.md) | How the two execution modes fit together |

## Reference backend sources

| Source | What to use it for |
|---|---|
| [Gateway handlers](../services/gateway/internal/handlers/handlers.go) and [caller principals](../services/gateway/internal/principal/) | Authenticated request handling and enforcement |
| [Rego policy](../policy/authz.rego) | Consent, regional restrictions, exchange-purpose checks and permitted fields |
| [Consent service](../services/consent-service/) and [ADR 0008](adr/0008-opal-consent-sync.md) | Consent state and OPAL publication |
| [ADR 0011](adr/0011-opal-production-hardening.md) | Recorded OPAL hardening decisions and limits |
| [Identity broker](../services/identity-broker/chex_identity/main.py) | Demo registry resolution and registration |
| [AI governance stub](../services/ai-governance/chex_ai_governance/main.py) | Fixed-score outputs, in-memory decision records and approve/reject endpoints |
| [Compose stack](../deploy/docker-compose.yml) and [synthetic samples](../fhir/samples/) | Reference services and fixture data |
| [Threat model](../specs/threat-model.yaml) and [ADR 0000](adr/0000-threat-model.md) | Caller and trust boundaries |
| [Hermetic verification](../scripts/verify.sh), [cooperative demo](../scripts/demo.sh), [adversarial checks](../scripts/adversarial.sh) | Separate scopes of backend verification |
| [Security policy](../SECURITY.md) | Supported scope and reporting process |

## Technical background

These upstream links provide background on the technologies used. They do not
certify this project's implementation or replace its pinned dependencies and tests.

- [HL7 FHIR R4](https://hl7.org/fhir/R4/) — resource and API specification.
- [HAPI FHIR](https://hapifhir.io/) — reference FHIR server project.
- [Open Policy Agent](https://www.openpolicyagent.org/) — policy engine and Rego.
- [OPAL](https://github.com/permitio/opal) — policy and data distribution project.

## Preserved historical bibliography

The [original reference list at revision bae1c21](https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/bae1c21d9b3bbb5faf98d660ea39bf68d44f9e34/docs/references.md)
preserves reference identifiers `REF-FED-*`, `REF-EU-*`, `REF-EHDS-*`, `REF-AI-*`
and `REF-INT-*` used by earlier “Cloud Healthcare Exchange” design documents.
It includes standards, regulatory texts, commentary, and proposed regulatory
calendars. Entries vary in precision; some name a source without a direct link.
They have not been revalidated in this documentation update and should not be
presented as current legal guidance or verified compliance evidence.

For original context, see the preserved
[compliance mapping](https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/bae1c21d9b3bbb5faf98d660ea39bf68d44f9e34/docs/architecture/compliance-mapping.md),
[implementation plan](https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/bae1c21d9b3bbb5faf98d660ea39bf68d44f9e34/docs/plan.md),
and [roadmap](https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/bae1c21d9b3bbb5faf98d660ea39bf68d44f9e34/docs/roadmap.md).
The [ADRs](adr/) remain the decision history. Consult primary sources afresh before
reusing historical legislative dates or legal interpretations for any new purpose.
