# Governance

[Healthcare Data Exchange](README.md) is maintained by
[SafetyMP](https://github.com/SafetyMP). Its current scope is a guided synthetic
browser demo of consent, requesting teams, and regional access, with a separate
local FHIR/OPA/OPAL reference backend. The [product scope](docs/product-mandate.md)
describes intended users, boundaries, and acceptance criteria.

## Maintainers

| Role | Responsibility |
|---|---|
| Maintainers (`@SafetyMP`) | Merge policy, release tags, security triage |
| Contributors | Pull requests through [CONTRIBUTING.md](CONTRIBUTING.md) |

[CODEOWNERS](.github/CODEOWNERS) requests review for configured paths. Ownership,
review responsibilities, and maintainer authority are unchanged by the demo redesign.

## Decision process

1. **Small fixes:** propose a pull request and pass applicable required checks,
   including the repository's `portfolio-verify` gate. Follow
   [CONTRIBUTING.md](CONTRIBUTING.md) for local validation and review.
2. **Experience changes:** describe the user task, resulting behavior, and
   meaningful acceptance checks. Use the browser demo and its tests to verify
   simulated behavior. Label untested assumptions and user-research proposals.
3. **Architectural choices:** add or update an ADR under [docs/adr/](docs/adr/)
   before or with the pull request. Keep browser simulation, service contracts,
   and production proposals distinct.
4. **Portfolio and policy mirror:** follow the existing sync and cross-repository
   requirements in [AGENTS.md](AGENTS.md) and [ADR 0007](docs/adr/0007-opal-policy-mirror.md).
   This repository owns canonical policy; the mirror is not an independent editing target.
5. **Security:** follow [SECURITY.md](SECURITY.md) and use GitHub private
   vulnerability reporting for coordinated disclosure.

## Checks and evidence

| Surface | Relevant checks |
|---|---|
| Browser demo and guided flow | `cd web && npm run verify:demo`; review keyboard, responsive, and changed interaction behavior |
| Gateway-backed frontend | `cd web && npm run verify`; successful smoke tests alone do not verify backend requests |
| Reference services and repository contracts | `./scripts/verify.sh` |
| Backend authentication, Compose, or runtime demo paths | `./scripts/demo.sh` and `./scripts/adversarial.sh` against the running stack |
| Documentation and repository presentation | Verify links, source accuracy, and consistency with the current product scope |

Required remote checks and maintainer review govern merging. Static tests,
browser tests, backend scenarios, and published-site inspection are scoped evidence;
none alone establishes production readiness, clinical validity, legal compliance,
or improved engagement. The [roadmap](docs/roadmap.md) labels proposed work separately
from delivered capabilities.

## Releases and demo publication

- Version tags follow [Semantic Versioning](https://semver.org/).
- Release notes are curated in [CHANGELOG.md](CHANGELOG.md).
- `main` is the supported branch; see [SECURITY.md](SECURITY.md).
- The [Pages workflow](.github/workflows/pages.yml) publishes the browser demo from
  eligible successful runs on `main`. A Pages deployment does not create a versioned
  release or deploy the reference backend.
- [CITATION.cff](CITATION.cff) describes the current project. Citations should identify
  the commit or tagged release used rather than assign a past release version to
  newer `main` behavior.

## Scope boundaries

In scope are synthetic learning scenarios, readable access and consent workflows,
frontend accessibility, service reference experiments, and honest documentation.
Real patient data, clinical use, production exchange deployment, and certification
claims are outside the current product scope. Broader work requires its own
explicit scope and evidence; historical plans do not activate it.

## Related repositories

| Repository | Role |
|---|---|
| [Healthcare-Data-Exchange](https://github.com/SafetyMP/Healthcare-Data-Exchange) | Canonical frontend, reference backend, and policy source |
| [healthcare-policy](https://github.com/SafetyMP/healthcare-policy) | OPAL policy mirror; see [ADR 0007](docs/adr/0007-opal-policy-mirror.md) |

## Code of conduct

Community interaction follows [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
