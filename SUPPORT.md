# Support

## Getting help

| Need | Where to go |
|------|-------------|
| Bug or unexpected behavior | [Open a bug report](https://github.com/SafetyMP/Healthcare-Data-Exchange/issues/new?template=bug_report.yml) |
| Feature or design idea | [Open a feature request](https://github.com/SafetyMP/Healthcare-Data-Exchange/issues/new?template=feature_request.yml) |
| Security vulnerability | [Private vulnerability reporting](https://github.com/SafetyMP/Healthcare-Data-Exchange/security/advisories/new) — see [SECURITY.md](SECURITY.md) |
| Architecture questions | GitHub issue with the `question` label, or review [docs/](docs/README.md) and [ADRs](docs/adr/) |

## Self-service troubleshooting

```bash
./scripts/verify.sh    # hermetic checks (no Docker)
./scripts/run-dev.sh   # start compose stack
./scripts/demo.sh      # E2E proof (stack must be running)
```

Common issues:

- **HAPI slow to start** — JVM boot can take 2+ minutes per cell; wait for health checks.
- **OPAL auth failures** — run `./scripts/run-dev.sh` once to generate `deploy/opal/dev-secrets.env` (gitignored).
- **Policy drift** — after editing `policy/*.rego`, run `./scripts/sync-policy-repo.sh`.

## Response expectations

This is a volunteer-maintained reference project without an SLA. Security reports
are prioritized per [SECURITY.md](SECURITY.md).

## Contributing fixes

See [CONTRIBUTING.md](CONTRIBUTING.md).
