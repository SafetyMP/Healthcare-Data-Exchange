# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Open-source community health files, security workflows (CodeQL, Scorecard), Dependabot
- `CHANGELOG.md`, `CITATION.cff`, `GOVERNANCE.md`, `SUPPORT.md`, ADR 0007

## [0.4.0] - 2026-07-08

### Added

- OPAL secure mode: JWT auth, datasource tokens, webhook + bundle integrity (ADR 0011)
- Identity broker service with ITI-78 gateway integration (ADR 0010)
- SSRAA US auth stub (ADR 0009)
- OPAL alpine multi-arch; `run-dev.sh --down-first`, `teardown-dev.sh`, `setup-portfolio.sh`

### Changed

- Gateway resolves identifiers via identity-broker with `routing.yaml` fallback

## [0.3.0] - 2026-07-08

### Added

- OPAL dynamic consent sync and multi-repo portfolio governance (ADR 0008)
- `consent-service` as OPAL data source; live revoke/grant in `demo.sh`
- Portfolio verify CI across canonical + `healthcare-policy` mirror

## [0.2.0] - 2026-07-08

### Added

- Phase 3 integration: US HAPI cell, cross-bloc routing, identity broker stub
- Cross-bloc deny and derivative exception policy rules
- Synthetic FHIR samples (EU + US)

## [0.1.0] - 2026-07-08

### Added

- Initial reference implementation: EU jurisdiction cell, Go gateway, OPA policies
- AI governance stub, crypto-shred demo, architecture docs and ADRs 0001–0006

[Unreleased]: https://github.com/SafetyMP/Healthcare-Data-Exchange/compare/v0.4.1...main
[0.4.0]: https://github.com/SafetyMP/Healthcare-Data-Exchange/releases/tag/v0.4.0
