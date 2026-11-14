# Healthcare Data Exchange documentation

Start with the [live guided demo](https://safetymp.github.io/Healthcare-Data-Exchange/)
or the [repository overview](../README.md). Healthcare Data Exchange teaches
synthetic consent, requesting-team permissions, and regional access through an
interactive workspace. A separate local FHIR/OPA/OPAL backend supports service
experiments. Browser outcomes and backend enforcement are different evidence.

## First-time paths

| Your task | Read in this order |
|---|---|
| Explore the product | [Live demo](https://safetymp.github.io/Healthcare-Data-Exchange/) → [current product scope](product-mandate.md) → [guided walkthrough](guided-walkthrough.md) |
| Review the design | [Experience redesign](experience-redesign.md) → [independent experience review](live-experience-review.md) → [roadmap](roadmap.md) |
| Develop the frontend | [Web setup, modes and tests](../web/README.md) → [contribution guide](../CONTRIBUTING.md) |
| Work on backend behavior | [Architecture](architecture/overview.md) → [data flows](architecture/data-flows.md) → [threat model](adr/0000-threat-model.md) → [contribution guide](../CONTRIBUTING.md) |
| Use a coding agent | [AGENTS.md](../AGENTS.md) → task-specific source and instructions; [llms.txt](../llms.txt) is a navigation aid |
| Maintain GitHub presentation or hosting | [Repository settings](maintainer-github-settings.md) → [frontend Pages deployment](../web/README.md#github-pages) → [assets](assets/README.md) |

## Current scope and implementation

- [Product scope](product-mandate.md): intended audience, core workflow, boundaries, and acceptance criteria.
- [Web workspace](../web/README.md): reproducible setup for both modes and actual package scripts.
- [Architecture overview](architecture/overview.md): browser simulation and reference service boundaries.
- [Data flows](architecture/data-flows.md): backend request and consent paths.
- [Roadmap](roadmap.md): implemented work and proposed next steps.
- [Synthetic fixtures](../fhir/samples/README.md): sample-data provenance and limits.

## Design and verification records

These documents report bounded inspections and test results. They are not user
research, clinical validation, or blanket proof of deployment safety.

| Record | Scope |
|---|---|
| [Experience redesign](experience-redesign.md) | Source-based friction hypotheses, implemented workflow, and verification boundaries |
| [Independent live experience review](live-experience-review.md) | Reviewer-directed inspection, reproduced issues, fixes, and regression evidence |
| [Guided walkthrough](guided-walkthrough.md) | Nine-checkpoint teaching sequence, action matching, pause/resume, and tests |
| [Earlier demo baseline](evidence/demo-baseline.md) | Historical backend evidence; retain its original scope and date |
| [GitHub Actions](https://github.com/SafetyMP/Healthcare-Data-Exchange/actions) | Per-run remote checks and deployment records |

## Backend decision records

ADRs preserve implementation decisions and their context. An accepted design or
an aspirational title is not evidence of certification or production readiness.
Read the current source and test results when applying an older decision.

| ADR | Topic |
|---|---|
| [0000](adr/0000-threat-model.md) | Threat model and adversarial checks |
| [0001](adr/0001-jurisdiction-cells.md) | Jurisdiction cells |
| [0002](adr/0002-policy-opa-cedar.md) | OPA/Rego and earlier Cedar considerations |
| [0003](adr/0003-key-custody-crypto-shred.md) | Key custody and erasure reference |
| [0004](adr/0004-fhir-us-core-interop.md) | FHIR R4 and US Core scope |
| [0005](adr/0005-ai-governance-layer.md) | AI governance stub |
| [0006](adr/0006-patient-identity-matching.md) | Patient identity design |
| [0007](adr/0007-opal-policy-mirror.md) | Canonical policy and mirror workflow |
| [0008](adr/0008-opal-consent-sync.md) | OPAL consent distribution |
| [0009](adr/0009-ssraa-auth-stub.md) | US authentication stub |
| [0010](adr/0010-identity-broker-service.md) | Identifier broker |
| [0011](adr/0011-opal-production-hardening.md) | OPAL configuration and hardening proposals; not production certification |

The policy mirror is [healthcare-policy](https://github.com/SafetyMP/healthcare-policy).
Its role is defined in [specs/portfolio.yaml](../specs/portfolio.yaml); canonical
policy edits belong here.

## Historical context and reference

- [Earlier implementation plan](plan.md): historical phases and fleet planning; not current authorization to start work.
- [Original product mandate](https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/bae1c21d9b3bbb5faf98d660ea39bf68d44f9e34/docs/product-mandate.md): preserved July vision before the November product-scope rewrite.
- [Compliance mapping](architecture/compliance-mapping.md): architectural reference and proposed controls, not a legal determination or certification.
- [Glossary](glossary.md) and [references](references.md): terminology and source context; check dates before relying on time-sensitive statements.
- [Factory overlay](factory-overlay.md) and [mandate history](../specs/MANDATE.md): retained repository governance and delivery history. Begin new agent work at [AGENTS.md](../AGENTS.md).
- [Changelog](../CHANGELOG.md), [governance](../GOVERNANCE.md), and [citation metadata](../CITATION.cff): project history and attribution.

## Community

[Contributing](../CONTRIBUTING.md) · [Support](../SUPPORT.md) · [Security](../SECURITY.md) · [Code of conduct](../CODE_OF_CONDUCT.md) · [Apache-2.0 license](../LICENSE)

These community documents live at the repository root; there is no duplicate
`.github/` copy to override them.
