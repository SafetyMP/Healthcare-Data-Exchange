# Repository assets

Visual assets for Healthcare Data Exchange documentation and social sharing.
All patient examples are synthetic.

## Current social preview

The study roster case shows the record holder, exchange steward and receiving coordinator. The technical guide traces the selected packet and consent trial. [Business case desktop](research-request-desktop.jpg) · [Mobile](research-request-mobile.jpg) · [Full business case](research-request-full.jpg) · [Technical trial](research-request-technical.jpg)

| File | Purpose |
|------|---------|
| [`social-preview.svg`](social-preview.svg) | Editable source, exactly 1280 × 640 |
| [`social-preview.png`](social-preview.png) | Canonical rendered PNG, exactly 1280 × 640 |
| [`../../.github/social-preview.png`](../../.github/social-preview.png) | Identical copy for GitHub repository social preview upload |
| [`../../web/public/social-preview.png`](../../web/public/social-preview.png) | Identical copy published by the website for social metadata |

After editing the SVG, install the web dependencies if needed, then run the
social-only renderer from the repository root:

```bash
cd web && npm ci && cd ..
./scripts/render-social-preview.sh
```

The script uses the web app's installed Sharp renderer, verifies 1280 × 640 output,
and synchronizes all three PNG copies without regenerating architecture diagrams.
Commit the source and all copies together. Upload `.github/social-preview.png` in
GitHub repository **Settings → General → Social preview**; committing the image
does not update that repository setting. The website copy is published through
the GitHub Pages workflow.

## Product images and historical captures

| File | Purpose |
|------|---------|
| [`redesigned-workspace.jpg`](redesigned-workspace.jpg) | Redesigned workspace reference image; a static illustration, not verification of current behavior |
| [`demo.gif`](demo.gif) | Historical four-frame console tour (overview, patient lookup, consent and AI triage); historical compatibility forms |
| [`overview.png`](overview.png) | Retained console overview capture |
| [`patients.png`](patients.png) | Retained patient-access capture |
| [`consent.png`](consent.png) | Retained consent-management capture |
| [`ai-triage.png`](ai-triage.png) | Retained AI-governance capture |
| [`identity.png`](identity.png) | Retained identity-matching capture |

These retained screenshots and GIF may lag the current interface. Prefer the
[research consent case](https://safetymp.github.io/Healthcare-Data-Exchange/) for current
behavior. The capture utility remains available for an intentional refresh:

```bash
# In one terminal, serve the built application.
cd web && npm ci && npm run build && npm run start
# In another terminal, capture the running UI.
cd web && npm run screenshots
```

`npm run screenshots:rebuild-gif` rebuilds the GIF from existing PNGs only; it does
not capture or validate the current UI. Captures must use synthetic data.

## README status badges

Local SVGs used when third-party badge hosts are flaky. CI status still comes
from GitHub Actions.

| File | Purpose |
|------|---------|
| [`badges/scorecard.svg`](badges/scorecard.svg) | OpenSSF Scorecard score (update when score changes) |
| [`badges/release.svg`](badges/release.svg) | Latest release tag |
| [`badges/license.svg`](badges/license.svg) | License label |

## Architecture diagrams

Sources are SVG; PNGs are rendered for documentation. These diagrams describe
the reference backend rather than the browser-local simulation.

| File | Purpose |
|------|---------|
| [`architecture.svg`](architecture.svg) | Jurisdiction-cell overview (EU / US + global plane) |
| [`architecture.png`](architecture.png) | PNG export (1280px wide) |
| [`architecture-detailed.svg`](architecture-detailed.svg) | Reference component diagram with ports and services |
| [`architecture-detailed.png`](architecture-detailed.png) | PNG export (1400px wide) |
| [`policy-opal-flow.svg`](policy-opal-flow.svg) | Policy mirror + OPAL + consent distribution |
| [`policy-opal-flow.png`](policy-opal-flow.png) | PNG export |

For an intentional full diagram refresh, run `./scripts/render-assets.sh`. That
legacy command also renders the social preview; follow it with
`./scripts/render-social-preview.sh` to synchronize the website copy and keep all
social PNGs identical. For social-only changes, use only the social renderer above.
