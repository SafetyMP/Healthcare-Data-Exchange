# Repository settings (maintainers)

These GitHub settings are not stored in git. Apply after pushing OSS files.

## Metadata

**Description:** Federated health information exchange reference: EU/US jurisdiction cells, OPA policy-as-code, OPAL live consent, FHIR R4

**Topics:** `healthcare`, `fhir`, `open-policy-agent`, `opa`, `opal`, `gdpr`, `health-information-exchange`, `reference-architecture`, `go`, `python`, `docker-compose`

```bash
gh api -X PATCH repos/SafetyMP/Healthcare-Data-Exchange \
  -f description='Federated health information exchange reference: EU/US jurisdiction cells, OPA policy-as-code, OPAL live consent, FHIR R4'

gh api -X PUT repos/SafetyMP/Healthcare-Data-Exchange/topics \
  -f 'names[]=healthcare' -f 'names[]=fhir' -f 'names[]=open-policy-agent' \
  -f 'names[]=opa' -f 'names[]=opal' -f 'names[]=gdpr' \
  -f 'names[]=health-information-exchange' -f 'names[]=reference-architecture' \
  -f 'names[]=go' -f 'names[]=python' -f 'names[]=docker-compose'
```

## Security

1. **Private vulnerability reporting** — Settings → Code security and analysis → Enable
2. **Dependabot security updates** — Settings → Code security → Enable (`.github/dependabot.yml` handles version updates, including npm under `/web`)

## Social preview

Canonical assets:

| File | Purpose |
|------|---------|
| `docs/assets/social-preview.svg` | Editable source (1280×630 viewBox) |
| `docs/assets/social-preview.png` | Rendered PNG for GitHub upload (1280px wide) |
| `.github/social-preview.png` | Copy for discoverability in repo root metadata |

Render PNG from SVG:

```bash
./scripts/render-social-preview.sh
```

Upload to **Settings → Social preview** (no public API — uses Playwright UI automation):

```bash
./scripts/upload-social-preview.sh --login   # once, saves browser session
./scripts/upload-social-preview.sh           # after render
```

Manual alternative: **Settings → General → Social preview → Edit** → upload `docs/assets/social-preview.png`.

## Branch protection (required)

Protect `main` (enforce for admins):

- Require a pull request before merging
- Require at least **1** approving review
- Require review from Code Owners (`.github/CODEOWNERS` → `@SafetyMP` until named owners are assigned)
- Do not allow force pushes or deletions
- Require status checks to pass before merging (strict: branches up to date):

| Check name (Actions job) | Workflow |
|--------------------------|----------|
| `canonical` | portfolio-verify |
| `demo` | demo-e2e |
| `Analyze (go)` | CodeQL |
| `Analyze (python)` | CodeQL |
| `Analyze (javascript-typescript)` | CodeQL |
| `Scorecard analysis` | OpenSSF Scorecard |
| `verify` | web-ui (when that workflow runs) |

Apply / refresh via API (after checks have appeared at least once on `main`):

```bash
gh api -X PUT repos/SafetyMP/Healthcare-Data-Exchange/branches/main/protection \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "canonical",
      "demo",
      "Analyze (go)",
      "Analyze (python)",
      "Analyze (javascript-typescript)",
      "Scorecard analysis"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "require_code_owner_reviews": true,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

Notes:

- Job `verify` (web-ui) is path-filtered (`web/**`, `services/gateway/**`); require it when consolidating branch rules that support optional checks, or keep it as a soft gate.
- Definition of Done remains `./scripts/verify.sh`, `./scripts/demo.sh`, and `./scripts/adversarial.sh` (the latter two run inside `demo-e2e`).

## First release

```bash
git tag -a v0.4.0 -m "Phase 4b: OPAL hardening, identity broker, SSRAA stub"
git push origin v0.4.0
gh release create v0.4.0 --title "v0.4.0" --notes-file CHANGELOG.md
```

## OpenSSF Best Practices Badge

Apply at https://www.bestpractices.dev/ after community files and CI are on `main`.
