# Repository settings for maintainers

[repository-metadata.json](../.github/repository-metadata.json) records the
intended description, homepage and topics. Apply these values to GitHub's About
settings, then read them back. They describe the guided synthetic demo and
separate reference backend without implying certification or production use.

## Discovery and social preview

- Homepage: <https://safetymp.github.io/Healthcare-Data-Exchange/>.
- Topics: use the curated metadata list (GitHub permits up to 20).
- After installing web dependencies, run `./scripts/render-social-preview.sh`
  from the repository root to synchronize the three PNG copies.
- Upload `docs/assets/social-preview.png` through **Settings → General →
  Social preview → Edit**. The PNG is 1280×640 and below 1 MB. Committing
  `.github/social-preview.png` does not change the GitHub setting.
- Root `CITATION.cff` enables GitHub's citation entry point. Include the actual
  commit or release in reproducible citations.

See [discovery implementation and sources](discoverability.md) and
[asset maintenance](assets/README.md). GitHub settings and public-page checks
are separate from source validation.

## Security and branch protection

Verified on 2026-11-14: private vulnerability reporting, Dependabot security
updates, secret scanning and push protection are enabled. Preserve them. Route
private reports through [Security advisories](https://github.com/SafetyMP/Healthcare-Data-Exchange/security/advisories/new).
Dependency alerts and CodeQL are separate evidence; verify both after fixes.

`main` requires a PR, up-to-date status checks, linear history and administrator
enforcement. Force pushes and deletions are disabled. Required checks are:

| Check | Workflow |
|---|---|
| `canonical` | `portfolio-verify` |
| `demo` | `demo-e2e` |
| `Analyze (go)` | CodeQL |
| `Analyze (python)` | CodeQL |
| `Analyze (javascript-typescript)` | CodeQL |

The frontend `verify` and Pages `Static demo checks` jobs are path-filtered;
review their results whenever relevant. Do not make a path-filtered job mandatory
without ensuring every PR reports it. Scorecard runs on main/schedule, not every
PR, so it is not a required PR check. Actions remain SHA-pinned. Existing
schedules are retained.

### Solo-maintainer exception

With `@SafetyMP` as the only write-access maintainer, required approving reviews
are zero and Code Owner approval enforcement is off. [CODEOWNERS](../.github/CODEOWNERS)
still routes ownership. Independent task review and CI remain necessary; the
maintainer cannot approve their own PR. When a second write-access maintainer
is added, restore one required approving review and Code Owner enforcement.
Do not weaken PR, status, linear-history or administrator protections.

## Publishing and releases

Use a focused branch and PR describing concrete behavior, evidence and limits.
Follow [CONTRIBUTING.md](../CONTRIBUTING.md) for mode-specific checks. Merge after
applicable checks pass, then verify the exact merged commit's Pages deployment
and public assets. A green PR build alone is not deployment proof.

The latest release observed on 2026-11-14 is `v0.5.0`, published 2026-07-19.
Current demo and repository work is **Unreleased** in the [changelog](../CHANGELOG.md).
Do not retag the historical release or imply it includes current main. A new
release needs its own reviewed notes and explicit release scope.

Use live Actions badges for CI. Local Scorecard/release badges are historical
snapshots. Do not add certification or OpenSSF Best Practices badges without a
real, verified project result.
