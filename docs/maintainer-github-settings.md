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

1. **Private vulnerability reporting** — **Enabled** on this repository (confirm: Settings → Code security → Private vulnerability reporting). Entry point: [Security advisories](https://github.com/SafetyMP/Healthcare-Data-Exchange/security/advisories/new).
2. **Dependabot security updates** — **Enabled** (`.github/dependabot.yml` handles version updates, including npm under `/web`)

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
- Do not allow force pushes or deletions
- Require status checks to pass before merging (strict: branches up to date):

| Check name (Actions job) | Workflow |
|--------------------------|----------|
| `canonical` | portfolio-verify |
| `demo` | demo-e2e |
| `Analyze (go)` | CodeQL |
| `Analyze (python)` | CodeQL |
| `Analyze (javascript-typescript)` | CodeQL |
| `verify` | web-ui (path-filtered; soft gate) |

**Not a PR-required check:** `Scorecard analysis` runs on `push` to `main`, schedule, and `branch_protection_rule` — not on `pull_request`. Keep it enabled for supply-chain visibility; do not list it as a required PR status check.

### Solo-maintainer exception

While `@SafetyMP` is the only write-access maintainer, GitHub cannot satisfy
“approve your own PR” + Code Owner review. Under that condition:

| Setting | Solo exception | Dual-maintainer restore |
|---------|----------------|-------------------------|
| Approving reviews required | **0** | **1** |
| Require Code Owner reviews | **false** | **true** |
| `.github/CODEOWNERS` | Kept (routing / ownership signal) | Same; enable enforcement |

Do **not** disable pull-request-before-merge, status checks, linear history, or
`enforce_admins` as part of this exception. When a second write-access maintainer
is added, restore the dual-maintainer column immediately.

Apply / refresh via API (after checks have appeared at least once on `main`):

```bash
# Solo-maintainer exception (current)
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
      "Analyze (javascript-typescript)"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "require_code_owner_reviews": false,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

Dual-maintainer restore (when a second reviewer exists):

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
      "Analyze (javascript-typescript)"
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

- Job `verify` (web-ui) is path-filtered (`web/**`, `services/gateway/**`); soft gate unless your rules support optional checks.
- Definition of Done remains `./scripts/verify.sh`, `./scripts/demo.sh`, and `./scripts/adversarial.sh` (the latter two run inside `demo-e2e`).
- Solo exception unblocks self-authored PRs; it does not replace CI or the PR requirement.

## Releases

```bash
# After CHANGELOG [0.5.0] (or next) is on main:
git tag -a v0.5.0 -m "v0.5.0: corp-site harness, adversarial oracle, supply-chain hardening"
git push origin v0.5.0
gh release create v0.5.0 --title "v0.5.0" --notes-file CHANGELOG.md --latest
```

## README status badges

CI badges (`portfolio-verify`, `demo-e2e`, `CodeQL`) use GitHub Actions `badge.svg` URLs.

Scorecard / license / release badges are local SVGs under `docs/assets/badges/` so the
README does not depend on shields.io or `api.scorecard.dev` badge redirects (those have
been intermittently returning Cloudflare 520s). Refresh them when the published facts change:

| Badge | Update when |
|-------|-------------|
| `docs/assets/badges/scorecard.svg` | OpenSSF Scorecard score changes (see https://scorecard.dev/viewer/?uri=github.com/SafetyMP/Healthcare-Data-Exchange) |
| `docs/assets/badges/release.svg` | Cutting a new GitHub release / tag |
| `docs/assets/badges/license.svg` | License change (rare) |

Do **not** reintroduce a yellow “Best Practices — pending” shields badge. Add an OpenSSF
Best Practices badge only after a real project ID exists.

## OpenSSF Best Practices Badge

1. Sign in at https://www.bestpractices.dev/ and **Add project** with  
   `https://github.com/SafetyMP/Healthcare-Data-Exchange`
2. Complete the questionnaire (many answers are already covered by `SECURITY.md`, CI, and community files).
3. Add the project-specific badge to `README.md`:  
   `https://www.bestpractices.dev/projects/<ID>/badge`.

No Best Practices badge is shown until registration completes (Scorecard `CII-Best-Practices`
stays at 0 until then).
