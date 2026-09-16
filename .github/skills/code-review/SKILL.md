---
name: code-review
description: "Review HIE PRs for jurisdiction cells, OPAL consent, and no-PHI rules. Use on pull requests that touch services/gateway, consent-service, policy/*.rego, or fhir/samples. Flag query-param jurisdiction and real patient data."
---

# Copilot code review — Healthcare-Data-Exchange

Use this skill when reviewing a pull request in this repository.

This is a **federated HIE architecture sketch**, not a production exchange.

- Reject real PHI.
- Reject query-parameter jurisdiction as identity.
- Reject invented policy-sync paths; use `./scripts/sync-policy-repo.sh`.
- Hermetic verify: `./scripts/verify.sh`. Runtime proof needs Compose demo + adversarial.


## Always flag

- Secrets, `.env` values, private keys, or real personal data in the diff
- Weakened or skipped verify / lint / typecheck / adversarial gates
- Invented success (prose claiming a gate passed with no command output)
- Fail-open authorization, skipped human approval, or agents recording `--actor user`

## Never request

- Drive-by major upgrades, formatter churn, or unrelated refactors
- Softening honesty disclaimers or certification claims
