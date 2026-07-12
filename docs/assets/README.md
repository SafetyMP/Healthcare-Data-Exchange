# Repository assets

Visual assets for README, docs, and GitHub social preview. Sources are SVG; PNGs are generated for crisp rendering on GitHub and social platforms.

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
