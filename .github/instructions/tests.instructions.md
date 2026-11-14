---
applyTo: "**/*_test.go,**/*test*.py,**/tests/**/*.py,**/*.{test,spec}.ts,**/*.{test,spec}.tsx,**/tests/**/*.mjs"
---

# Test standards

- Cover deny paths, not only allow paths, for authorization and residency code.
- pytest for Python services; `go test` in the gateway module; Node tests and Playwright for `web/`.
- Do not skip or weaken verify, ruff, or adversarial gates.
- Do not invent a passing gate from prose.
- Fixtures are synthetic. Never commit secrets, live tenant data, or real PHI.

## This repository

- Hermetic Definition of Done: `./scripts/verify.sh` (no Docker).
- Runtime proof is `./scripts/demo.sh` plus `./scripts/adversarial.sh` with Compose up. Do not cite `verify.sh` alone as cross-bloc evidence.
- `fhir/samples/` is synthetic only.
- `cd web && npm run verify:demo` runs unit tests, typecheck, static export, and browser
  checks against the exported subpath. `cd web && npm run verify` checks gateway-mode UI.
- Preserve regression coverage for consent grant/revoke, purpose separation, caller
  context, regional deny/limited derivative paths, no demo API calls, direct route reloads,
  reset/persistence, and action-driven walkthrough progress. Keep accessibility checks.
- Treat fixture results, live API contract checks, Compose runtime proof, and deployed
  browser evidence as different evidence classes. Do not infer one from another.
