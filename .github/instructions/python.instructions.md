---
applyTo: "**/*.py"
---

# Python coding standards

- Type-annotate public functions and module-level APIs.
- Follow the existing Ruff / pyproject configuration. Do not disable rules repository-wide to land a change.
- Tests use pytest and the existing `tests/` layout.
- Never print, log, or commit secrets, `.env` values, or private keys.
- Do not claim a gate passed from prose. Run the documented verify command and keep the output.

## This repository

- The backend reference FastAPI services are `consent-service`, `identity-broker`,
  and `ai-governance`; the published browser demo does not run them.
- Consent decisions read `data.consent` published by OPAL, not a static request field.
- Preserve the governance stub's human-oversight boundary; do not present stub output
  or browser simulation as a clinically validated model or completed human review.
