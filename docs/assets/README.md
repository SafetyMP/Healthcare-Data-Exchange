# Repository assets

Visual assets for README, docs, and GitHub social preview.

## Clinician console (web UI)

| File | Purpose |
|------|---------|
| [`demo.gif`](demo.gif) | README hero — overview, patient lookup, consent, AI triage (4 frames, 2s each). Regenerate with `cd web && npm run screenshots`. |
| [`overview.png`](overview.png) | Dashboard / workflow index |
| [`patients.png`](patients.png) | Policy-gated FHIR patient read |
| [`consent.png`](consent.png) | Consent grant/revoke admin |
| [`ai-triage.png`](ai-triage.png) | AI governance triage stub |
| [`identity.png`](identity.png) | ITI-78-style identifier resolve |

Synthetic demo data only — no real PHI. Regenerate when the clinician console layout changes materially:

```bash
./scripts/run-dev.sh          # backend stack (optional for static UI capture)
cd web && npm ci && npm run build && npm run start
cd web && npm run screenshots # or npm run screenshots:rebuild-gif from existing PNGs
```

## Architecture diagrams

Sources are SVG; PNGs are generated for crisp rendering on GitHub and social platforms.

| File | Purpose |
|------|---------|
| [`architecture.svg`](architecture.svg) | Jurisdiction-cell overview (EU / US + global plane) |
| [`architecture.png`](architecture.png) | PNG export (1280px) |
| [`architecture-detailed.svg`](architecture-detailed.svg) | PoC component diagram with ports and services |
| [`architecture-detailed.png`](architecture-detailed.png) | PNG export (1400px) |
| [`policy-opal-flow.svg`](policy-opal-flow.svg) | Policy mirror + OPAL + consent distribution |
| [`policy-opal-flow.png`](policy-opal-flow.png) | PNG export |
| [`social-preview.svg`](social-preview.svg) | GitHub social preview source (1280x630) |
| [`social-preview.png`](social-preview.png) | Upload to **Settings → Social preview** |

Regenerate PNGs after editing SVG sources:

```bash
./scripts/render-assets.sh
```

Social preview upload (one-time browser login):

```bash
./scripts/upload-social-preview.sh --login
./scripts/upload-social-preview.sh
```
