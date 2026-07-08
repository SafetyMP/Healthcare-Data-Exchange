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
2. **Dependabot security updates** — Settings → Code security → Enable (`.github/dependabot.yml` handles version updates)

## Social preview

Upload `docs/assets/social-preview.svg` (or export as PNG 1280×640) as the repository social preview image under **Settings → General → Social preview**.

## Branch protection (recommended)

Protect `main`:

- Require PR before merge
- Require status checks: `canonical` (portfolio-verify), CodeQL, Scorecard (after first run)

## First release

```bash
git tag -a v0.4.0 -m "Phase 4b: OPAL hardening, identity broker, SSRAA stub"
git push origin v0.4.0
gh release create v0.4.0 --title "v0.4.0" --notes-file CHANGELOG.md
```

## OpenSSF Best Practices Badge

Apply at https://www.bestpractices.dev/ after community files and CI are on `main`.
