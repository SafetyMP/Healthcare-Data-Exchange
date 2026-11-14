---
name: code-review
description: "Review Healthcare Data Exchange PRs for guided synthetic-demo behavior, demo/live separation, consent and requester context, backend authorization, and no-PHI rules. Use on web, gateway, consent, policy, fixture, or related documentation changes."
---

# Copilot code review — Healthcare-Data-Exchange

Use this skill when reviewing a pull request in this repository.

This project is a **guided synthetic access-and-consent demonstration** with a
separate FHIR/OPA/OPAL backend reference. The published demo runs in the browser;
neither mode is a production exchange or a clinical record system.

- Reject real PHI.
- Reject query-parameter jurisdiction as identity.
- Reject invented policy-sync paths; use `./scripts/sync-policy-repo.sh`.
- Hermetic verify: `./scripts/verify.sh`. Runtime proof needs Compose demo + adversarial.
- Frontend checks: `cd web && npm run verify:demo` for exported simulation, and
  `cd web && npm run verify` for gateway-mode UI. Check source and actual test
  evidence; static fixtures do not prove live gateway, OPA, OPAL, or clinical behavior.
- Review consent/purpose separation, requester preservation through consent round
  trips, accurate decision explanations, stale-result invalidation, and limited fields.
- For the guide, inspect action/result-driven progress, pause/resume and reset recovery,
  keyboard/mobile behavior, and explicit simulation context. It must not run in live mode.
- Read [the root contract](../../../AGENTS.md) and
  [the agent guide](../../../docs/agent-guide.md) for scoped source navigation.


## Always flag

- Secrets, `.env` values, private keys, or real personal data in the diff
- Weakened or skipped verify / lint / typecheck / adversarial gates
- Invented success (prose claiming a gate passed with no command output)
- Fail-open authorization, skipped human approval, or agents recording `--actor user`
- Browser credential persistence, query presets treated as live identity, fixture
  success replacing a failed live API call, or claims that the session activity is a durable audit log
- Changes to corporate approval state, preserved evidence, or historical halted
  runtime state without explicit applicable authorization

## Never request

- Drive-by major upgrades, formatter churn, or unrelated refactors
- Softening honesty disclaimers or certification claims
