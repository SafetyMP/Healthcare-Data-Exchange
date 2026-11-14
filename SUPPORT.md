# Support

Healthcare Data Exchange includes a guided browser demo and a separate reference
backend. Identify which mode you are using when asking for help.

## Find the right starting point

| Need | Start here |
|---|---|
| Explore consent, requesting teams and regional access | [Live demo](https://safetymp.github.io/Healthcare-Data-Exchange/) → **Start guided walkthrough** |
| Run the browser demo or live-gateway frontend locally | [Frontend guide](web/README.md) |
| Understand scope and architecture | [Documentation index](docs/README.md) |
| Report incorrect behavior | [Bug report](https://github.com/SafetyMP/Healthcare-Data-Exchange/issues/new?template=bug_report.yml) |
| Suggest an improvement | [Feature request](https://github.com/SafetyMP/Healthcare-Data-Exchange/issues/new?template=feature_request.yml) |
| Ask a usage or design question | [Question](https://github.com/SafetyMP/Healthcare-Data-Exchange/issues/new?template=question.yml) |
| Report a vulnerability | [Private security report](https://github.com/SafetyMP/Healthcare-Data-Exchange/security/advisories/new), following [SECURITY.md](SECURITY.md) |

## Browser-demo troubleshooting

- **Access blocked:** this can be the intended result. Read the reason, then check the
  selected patient, purpose, requesting team and consent. Consent does not override
  regional restrictions.
- **Next step is unavailable:** complete the action shown in the guide and check its
  result. Saving consent alone does not complete a step that also requires an access check.
- **Explored a different scenario:** **Return to this step** restores the intended
  selections without changing consent. **Pause walkthrough** lets you explore freely.
- **Need the starting state:** **Reset demo**, or **Restart walkthrough**, restores
  this tab's simulated consent and clears activity. The guide explains its reset behavior
  before starting. Save any useful observations before restarting.
- **Progress was not restored:** progress is local to the browser tab. Private browsing,
  unavailable browser storage, or closing the tab can affect persistence.
- **Unexpected layout or keyboard behavior:** report the page, browser, approximate
  viewport size, input method and the exact control involved.

The GitHub Pages demo does not need Docker or contact the gateway. A gateway connection
error in a local frontend should be investigated using the live-mode setup instructions.

## Reference-backend troubleshooting

```bash
./scripts/verify.sh       # hermetic checks; no Docker
./scripts/run-dev.sh      # start the local Compose stack
./scripts/demo.sh         # cooperative E2E with the stack running
./scripts/adversarial.sh  # authorization and residency denial scenarios
```

- **HAPI startup:** JVM boot can take more than two minutes per cell; inspect health checks.
- **OPAL authentication:** the development startup generates local secrets. Do not paste
  their contents into an issue.
- **Policy drift:** after editing `policy/*.rego`, use `./scripts/sync-policy-repo.sh`.

For a reproducible report, include the commit if known, the mode, synthetic scenario,
expected and actual behavior, and sanitized logs. Never include real health data,
credentials, tokens or private records.

## Response expectations

This is a volunteer-maintained demonstration and reference project without an SLA.
It does not provide clinical advice or production incident support. Contributions and
reproduction details are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).
