---
applyTo: "**/*.py"
---

# Python coding standards (September 2026)

- Type-annotate public functions and module-level APIs.
- Follow the existing Ruff / pyproject configuration. Do not disable rules repository-wide to land a change.
- Tests use pytest and the existing `tests/` layout.
- Never print, log, or commit secrets, `.env` values, or private keys.
- Do not claim a gate passed from prose. Run the documented verify command and keep the output.

## This repository

- FastAPI services: `consent-service`, `identity-broker`, `ai-governance`.
- Consent decisions read `data.consent` published by OPAL, not a static request field.
