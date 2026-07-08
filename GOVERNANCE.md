# Governance

Cloud Healthcare Exchange (CHEX) is an open-source **reference implementation**
maintained by [SafetyMP](https://github.com/SafetyMP). It demonstrates
architecture patterns; it does not claim certification, an ATO, or production
readiness.

## Maintainers

| Role | Responsibility |
|------|----------------|
| Maintainers (`@SafetyMP`) | Merge policy, release tags, security triage |
| Contributors | PRs via [CONTRIBUTING.md](CONTRIBUTING.md) |

CODEOWNERS auto-requests review on sensitive paths (see [.github/CODEOWNERS](.github/CODEOWNERS)).

## Decision process

1. **Small fixes** — PR + green `portfolio-verify` CI.
2. **Architectural choices** — new or updated ADR under `docs/adr/` before or with the PR.
3. **Portfolio / policy mirror** — changes to `specs/portfolio.yaml` or `policy/*.rego` require `./scripts/sync-policy-repo.sh` and cross-repo checks.
4. **Security** — follow [SECURITY.md](SECURITY.md); coordinated disclosure via GitHub private vulnerability reporting.

## Releases

- Version tags follow [Semantic Versioning](https://semver.org/).
- Release notes are curated in [CHANGELOG.md](CHANGELOG.md).
- `main` is the supported branch (see SECURITY.md).

## Scope boundaries

- **In scope:** walking skeleton, honest demos, design authority docs.
- **Out of scope:** production deployment guides, certification claims, real PHI.

## Related repositories

| Repo | Role |
|------|------|
| [Healthcare-Data-Exchange](https://github.com/SafetyMP/Healthcare-Data-Exchange) | Canonical application + policy source |
| [healthcare-policy](https://github.com/SafetyMP/healthcare-policy) | OPAL policy mirror (ADR 0007) |

## Code of conduct

Community interaction follows [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
