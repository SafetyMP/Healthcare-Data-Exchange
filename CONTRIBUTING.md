# Contributing to Healthcare Data Exchange

Healthcare Data Exchange helps people explore how consent, requesting teams and
regional rules affect access to synthetic patient records. Contributions can improve
the guided browser experience, its accessibility and explanations, or the separate
FHIR/OPA/OPAL reference backend. Neither mode is a production clinical system.

## Choose your starting point

1. Try the [research consent case](https://safetymp.github.io/Healthcare-Data-Exchange/)
   and read the [project scope](docs/product-mandate.md).
2. Read [AGENTS.md](AGENTS.md) for repository commands, boundaries and layout.
3. Check existing [issues](https://github.com/SafetyMP/Healthcare-Data-Exchange/issues)
   before proposing a change. Describe the user problem before a large implementation.
4. For policy work, read the [portfolio contract](specs/portfolio.yaml). This repository
   owns the canonical policy; `healthcare-policy` is its mirror.

## Work on the browser demo

Use Node.js 22 and npm 10.9.2 or a compatible npm 10 version. The versions supported
by the frontend are declared in [web/package.json](web/package.json).

```bash
cd web
npm ci
npx playwright install chromium
npm run lint
npm run verify:demo
npm run preview:demo
```

The preview serves the static export at
`http://127.0.0.1:3100/Healthcare-Data-Exchange/`. It needs no backend or credentials.
Rebuild with `npm run build:demo` after editing source before previewing again.
See [web/README.md](web/README.md) for frontend development and live-gateway mode.

Preserve the distinction between observed demo results and live policy enforcement.
The guide must use the actual forms, keep the patient's purpose and requesting team
clear, and explain denied as well as allowed results. For interface changes, exercise
keyboard navigation, a narrow mobile viewport, and the affected consent/access flow.
Use only fictional data in screenshots and reports.

## Work on the reference backend

Prerequisites: Docker, Go 1.22+, Python 3.12+, `curl`, and PyYAML. From the repository root:

```bash
./scripts/verify.sh          # hermetic checks; no Docker
./scripts/run-dev.sh         # start the local Compose stack
./scripts/demo.sh            # cooperative scenarios after stack startup
./scripts/adversarial.sh     # authorization and residency denial scenarios
```

The first verification may download OPA and create service virtual environments.
The development stack generates local, gitignored OPAL secrets. Do not commit or
include those secrets in logs, issues or screenshots.

## Definition of done

| Change | Validation to record in the PR |
|---|---|
| Any code or documentation | `./scripts/verify.sh` |
| Browser demo or walkthrough | Frontend lint and `npm run verify:demo`; inspect the affected interaction and responsive layout |
| Live-gateway frontend | `npm run verify` plus the relevant gateway-backed behavior with the stack running |
| Gateway, services, Compose, consent or OPAL behavior | `./scripts/demo.sh` and `./scripts/adversarial.sh` with the stack running |
| `policy/*.rego` | Hermetic checks, `./scripts/sync-policy-repo.sh`, then the relevant Compose scenarios |
| Portfolio contract | `./scripts/check-portfolio.sh` |

If a check cannot run, say what was not verified and why. A browser-local result
is not proof that OPA, OPAL or HAPI ran; hermetic tests do not replace Compose E2E.
Preserve required CI checks and the PR-before-merge workflow. See
[maintainer settings](docs/maintainer-github-settings.md) for the current check policy.

## Pull requests

- Keep changes focused and preserve existing stacks and conventions.
- Explain the concrete problem, resulting behavior and relevant validation.
- Include a screenshot for a visible UI change and reproduction steps for a workflow fix.
- Add meaningful regression coverage for behavior changes; do not weaken assertions
  just to accommodate a regression.
- Never include real patient information, `.env` files, keys or credentials.
- Keep certification, production-readiness and user-outcome claims tied to evidence.
- For policy changes, state whether the mirror was synchronized; never edit the mirror
  independently. Missing mirror access should be reported explicitly.

Use the [pull request template](.github/pull_request_template.md). Governance and
release history are in [GOVERNANCE.md](GOVERNANCE.md) and [CHANGELOG.md](CHANGELOG.md).

## Conventions and conduct

- Frontend: React/TypeScript and the existing Next.js structure under `web/`.
- Gateway: `gofmt` and the existing Go package boundaries.
- Python services: Ruff and pytest as configured per service.
- Policy: Rego tests; consent comes from OPAL-published `data.consent`.
- Architecture: record significant decisions in a new numbered ADR under `docs/adr/`.

Follow the [Code of Conduct](CODE_OF_CONDUCT.md). Use
[private vulnerability reporting](SECURITY.md) for security findings; ordinary bugs,
questions and design ideas belong in [issues](https://github.com/SafetyMP/Healthcare-Data-Exchange/issues/new/choose).
