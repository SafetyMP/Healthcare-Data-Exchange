---
applyTo: "**/*_test.go,**/*test*.py,**/tests/**/*.py,**/*.{test,spec}.ts,**/*.{test,spec}.tsx"
---

# Test standards (September 2026)

- Cover deny paths, not only allow paths, for authorization and residency code.
- pytest for Python services; `go test` in the gateway module; `cd web && npm run verify` for the clinician console.
- Do not skip or weaken verify, ruff, or adversarial gates.
- Do not invent a passing gate from prose.
- Fixtures are synthetic. Never commit secrets, live tenant data, or real PHI.

## This repository

- Hermetic Definition of Done: `./scripts/verify.sh` (no Docker).
- Runtime proof is `./scripts/demo.sh` plus `./scripts/adversarial.sh` with Compose up. Do not cite `verify.sh` alone as cross-bloc evidence.
- `fhir/samples/` is synthetic only.
