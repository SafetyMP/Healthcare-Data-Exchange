# Healthcare Data Exchange — web workspace

Patient access, consent, identity matching, and human oversight for the repository's
synthetic FHIR demonstration. Built with the existing Next.js, React, TypeScript,
and Tailwind stack. This is not a clinical record system or a production exchange.

## Browser demo

The GitHub Pages build runs entirely in the browser with synthetic fixtures. It
makes no gateway calls, requests no credentials, and stores simulated consent and
activity in session storage for the current tab. **Reset demo** restores initial
consent and clears activity. If browser storage is unavailable, state lasts only
until reload. Do not enter real patient data.

```bash
cd web
npm ci
npm run build:demo
npm run preview:demo
# http://127.0.0.1:3100/Healthcare-Data-Exchange/
```

Try Patient access → Research → Check access for Anna Mueller. Review consent,
grant research consent, and check access again. Revoke it to see the next request
blocked. Treatment and limited derivative examples illustrate purpose and region
restrictions; these are fixture decisions, not live OPA or OPAL evidence.

`NEXT_PUBLIC_DEMO_MODE=true` is an explicit build-time switch. Static builds use
`output: "export"` and `trailingSlash: true`, emitting `out/` with a separate HTML
document for each route. `NEXT_PUBLIC_BASE_PATH` defaults to
`/Healthcare-Data-Exchange`; set it consistently for build, preview, and tests
when deploying at a different path (use an empty value for a domain root).

## Local gateway mode

```bash
# From the repository root, start the existing backend:
./scripts/run-dev.sh
cd web
npm run dev
# http://localhost:3100
```

With the demo switch unset, `/api/*` proxies to `CHEX_GATEWAY_URL` (default
`http://127.0.0.1:8081`). Patient authorization remains credential-based; live
consent changes require the admin bearer. Fixture state is never substituted for
an unavailable gateway. Build again when changing modes.

## Verification

```bash
npm run verify       # live-mode typecheck, build, smoke and axe
npm run verify:demo  # static build, subpath reloads, consent flows, deny paths, axe
```

Install the browser once with `npx playwright install chromium`. Demo tests run
against the exported files through the included Node static server, not Next's
development server. The test server intentionally refuses to reuse an occupied
port so a different build or mode cannot produce a false pass. Stop a manually
started preview before running tests.

These checks verify frontend behavior and simulation. Backend verification
remains `./scripts/verify.sh`; runtime evidence remains `./scripts/demo.sh` and
`./scripts/adversarial.sh` against the running Compose stack.

## GitHub Pages

[The Pages workflow](../.github/workflows/pages.yml) builds and checks pull
requests without publishing them. After merge to `main`, successful static checks
produce the artifact deployed to the `github-pages` environment. A manual
workflow dispatch on `main` is also supported. The repository Pages source must
be set to **GitHub Actions**; preserve branch protection and merge required checks
before publication. The intended URL is
[SafetyMP's Healthcare Data Exchange demo](https://safetymp.github.io/Healthcare-Data-Exchange/).

Only `web/out` is uploaded. No backend, credentials, `.env` files, or service data
are included in the artifact. The workflow follows the official
[GitHub Pages custom workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
and [Next.js static export](https://nextjs.org/docs/app/guides/static-exports)
documentation. Action references are pinned to commit SHAs.

## Routes

| Route | Task |
|-------|------|
| `/` | Orientation, scenarios and recent activity |
| `/patients/` | Search patients and understand an access decision |
| `/consent/` | Review and change purpose-specific consent |
| `/identity/` | Resolve a synthetic identifier into patient context |
| `/activity/` | Inspect decisions and consent changes from this browser session |
| `/ai-triage/` | Inspect the AI governance stub and human oversight requirement |
