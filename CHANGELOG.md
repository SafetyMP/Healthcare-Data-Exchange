# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2026-07-19

### Added

- Corporate/site harness overlay (`.corp-harness/`, site agents/skills/rules) alongside live multi-repo `.harness/`
- Threat-model ADR 0000 + tier-3 `adversarial.sh` deny oracle (auth, residency, research/consent)
- `demo-e2e` CI (adversarial then cooperative demo); CodeQL for JavaScript/TypeScript; npm Dependabot for `/web`

### Security

- Force `postcss >= 8.5.10` via npm `overrides` (GHSA-qx2v-qp2m-jg93 / CVE-2026-41305)
- Branch protection: required `canonical`, `demo`, CodeQL language jobs; CODEOWNERS reviews

### Changed

- GitHub Actions: `setup-go`/`setup-python` v6, OpenSSF Scorecard action v2.4.3, CodeQL action v4 (SHA-pinned)
- Gateway runtime image `alpine:3.24`
- Clinician console deps: Next.js / eslint-config-next 16.2.10, Tailwind 4.3.3

## [0.4.1] - 2026-07-08

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

[Unreleased]: https://github.com/SafetyMP/Healthcare-Data-Exchange/compare/v0.5.0...main
[0.5.0]: https://github.com/SafetyMP/Healthcare-Data-Exchange/releases/tag/v0.5.0
[0.4.1]: https://github.com/SafetyMP/Healthcare-Data-Exchange/releases/tag/v0.4.1
[0.4.0]: https://github.com/SafetyMP/Healthcare-Data-Exchange/releases/tag/v0.4.0
