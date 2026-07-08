# Contributing to Cloud Healthcare Exchange

Thank you for your interest in this project. CHEX is a **reference implementation** and design authority — contributions should preserve honest scope (no certification claims) and keep verification paths green.

## Before you start

1. Read [product-mandate.md](docs/product-mandate.md) for scope and non-goals.
2. Skim [AGENTS.md](AGENTS.md) for repo commands and layout.
3. For policy changes, understand the [portfolio contract](specs/portfolio.yaml) (canonical repo + `healthcare-policy` mirror).

## Development setup

```bash
./scripts/verify.sh          # hermetic: harness, go, python×3, opa
./scripts/run-dev.sh         # docker compose stack
./scripts/demo.sh            # E2E after stack is up
```

**Prerequisites:** Docker, Go 1.22+, Python 3.12+. First `run-dev.sh` generates OPAL dev secrets locally (`deploy/opal/dev-secrets.env`, gitignored).

## Definition of done

| Change type | Required check |
|-------------|----------------|
| Any code/docs | `./scripts/verify.sh` |
| `policy/*.rego` | `./scripts/verify.sh` + `./scripts/sync-policy-repo.sh` |
| Compose / runtime / consent / OPAL | `./scripts/demo.sh` (stack running) |
| Portfolio contract | `./scripts/check-portfolio.sh` |

CI runs the same hermetic path via [.github/workflows/portfolio-verify.yml](.github/workflows/portfolio-verify.yml). CodeQL and OpenSSF Scorecard run on push/PR as well.

For release history, see [CHANGELOG.md](CHANGELOG.md). Governance and maintainer expectations: [GOVERNANCE.md](GOVERNANCE.md).

## Pull request guidelines

- **Smallest correct diff** — match existing conventions in each service.
- **One concern per PR** when possible (easier review).
- **No secrets** — never commit `.env`, `deploy/opal/dev-secrets.env`, keys, or credentials.
- **Honest claims** — if you cannot run `demo.sh`, say so in the PR; do not claim OPAL or E2E behavior without evidence.
- **Policy mirror** — if you change `policy/*.rego`, note whether `sync-policy-repo.sh` was run (mirror push may require repo access).

Use the [pull request template](.github/pull_request_template.md) checklist.

## Coding conventions

- **Go (gateway):** `gofmt`, existing package layout under `services/gateway/internal/`.
- **Python services:** FastAPI, `ruff` + `pytest` per service `pyproject.toml`.
- **Policy:** Rego tests in `policy/*_test.rego`; consent from `data.consent` (OPAL), not static request input.
- **ADRs:** Significant architectural choices get a new numbered ADR under `docs/adr/`.

## Questions and design discussion

Open a GitHub issue for bugs, feature ideas, or design questions. For large changes, describe the problem and proposed approach before a big implementation PR.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be respectful and constructive.
