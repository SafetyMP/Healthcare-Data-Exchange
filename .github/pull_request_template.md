## Problem and resulting behavior

<!-- Describe the user or developer problem and what changes. Include a concrete before/after example when useful. -->

## Scope

- [ ] Guided browser demo / interface / accessibility
- [ ] Live-gateway frontend
- [ ] Reference backend / policy / OPAL / deployment
- [ ] Documentation / discovery / community
- [ ] Other maintenance

## Validation

<!-- List the commands or manual checks actually run, their results, and anything not run with the reason. Mark unrelated items N/A rather than implying they passed. -->

- Repository: `./scripts/verify.sh`
- Browser changes: frontend lint, `npm run verify:demo`, and affected mobile/keyboard flow
- Live frontend changes: `npm run verify` and relevant gateway-backed checks
- Backend/runtime changes: `./scripts/demo.sh` and `./scripts/adversarial.sh`
- Policy changes: `./scripts/sync-policy-repo.sh` and relevant verification

<!-- Add a screenshot for visible changes. For guided-flow changes, identify the patient, purpose and requester used. Synthetic data only. -->

## Boundaries and follow-up

- [ ] No real patient data, secrets or credentials are included.
- [ ] Claims distinguish browser simulation, local checks, backend E2E and deployment evidence.
- [ ] Documentation and meaningful regression coverage reflect the change.

<!-- Note remaining limitations, compatibility concerns, or policy mirror synchronization status. -->
