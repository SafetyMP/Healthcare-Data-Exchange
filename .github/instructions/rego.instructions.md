---
applyTo: "**/*.rego"
---

# Rego coding standards

- Fail closed. Do not add a default allow to unblock an agent or a test.
- Keep package names and `data.*` paths consistent with existing tests.
- Do not encode identity or jurisdiction in query parameters.
- Pair policy edits with tests unless this repository is a documented mirror that forbids local `*_test.rego`.

## This repository

- Canonical OPA tree is `policy/` here. After edits, run `./scripts/sync-policy-repo.sh` before claiming OPAL policy is current.
- Do not invent a second policy-sync mechanism.
- This policy belongs to the separately run backend reference. Browser simulation
  illustrates selected fixture outcomes; it neither executes OPA nor verifies this policy.
- Every purpose remains consent-gated. Keep deny-by-default regional boundaries and
  minimum-necessary fields, including the limited derivative exception.
