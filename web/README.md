# Healthcare Data Exchange — web workspace

[**Open the live demo**](https://safetymp.github.io/Healthcare-Data-Exchange/) · [Product scope](../docs/product-mandate.md) · [Repository guide](../README.md)

The public case follows a study coordinator’s request for Anna Mueller’s record. The steward compares purpose-specific consent and field decisions. The exchange operations director compares pilot cost and capacity. The compact technical view keeps the selected request, consent trial and implementation stage in its link.

The existing stack is **Next.js 16.4.6, React, TypeScript, and Tailwind CSS**. Use
**Node.js 22** and **npm 10.9.2–10.x**, matching [package.json](package.json).

## Browser demo: no backend required

```bash
cd web
npm ci
npm run build:demo
npm run preview:demo
# http://127.0.0.1:3100/Healthcare-Data-Exchange/
```

For live frontend editing with synthetic fixtures:

```bash
NEXT_PUBLIC_DEMO_MODE=true npm run dev
# http://localhost:3100/Healthcare-Data-Exchange/
```

Choose **Inspect this request’s field evidence** in the case. Compare the opposite consent trial, filter a local packet, inspect endpoint uncertainty and compare the pinned mirror digest. Return to the selected request to resume the business case. [Operations guide](../docs/exchange-operations.md)

The browser demo makes no gateway calls and requires no credentials. Session
storage retains simulated consent, activity, and guide progress in the current
tab. **Reset tab demo** restores starting preferences and clears activity and guide
progress. If storage is unavailable, state lasts only until reload. Do not enter
real patient data. These fixture decisions are not evidence that OPA, OPAL, HAPI,
or a clinical AI model ran.

## Mode and path configuration

| Setting | Behavior |
|---|---|
| `NEXT_PUBLIC_DEMO_MODE=true` | Selects browser fixtures and static export at build time |
| Demo flag unset | Selects gateway requests and the server-mode rewrite |
| `NEXT_PUBLIC_BASE_PATH` | Demo URL prefix; defaults to `/Healthcare-Data-Exchange` |
| `CHEX_GATEWAY_URL` | Gateway rewrite target in server mode; defaults to `http://127.0.0.1:8081` |

Static builds use `output: "export"` and `trailingSlash: true`; `out/` contains an
HTML document for each route. Use the same base path for build, preview, and tests
when hosting elsewhere. Set an empty base path for a domain root. Rebuild when
changing mode or base path; the two builds share `.next/` and must not run concurrently.

## Local gateway mode

Start the reference stack from the repository root with Docker Compose available:

```bash
./scripts/run-dev.sh
cd web
npm ci
npm run dev
# http://localhost:3100
```

Keep `NEXT_PUBLIC_DEMO_MODE` unset for this mode. `/api/*` proxies to the configured
gateway. Patient authorization remains credential-based; consent writes require
an admin bearer. An unavailable gateway produces an error rather than fixture
fallback. Read the [reference architecture](../docs/architecture/overview.md) and
[security policy](../SECURITY.md) before working with credentials.

For a local production frontend build, use `npm run build` followed by
`npm run start`. Stop the reference stack from the repository root with
`./scripts/teardown-dev.sh`; default teardown retains volumes.

## Checks and scripts

Install the browser once:

```bash
npx playwright install chromium
```

| Script | Purpose |
|---|---|
| `npm run verify:demo` | Adapter and metadata tests, typecheck, static build, export metadata checks, and all demo browser tests |
| `npm run verify` | Typecheck, gateway-mode build, smoke and automated accessibility checks |
| `npm run test:unit` | API adapter, simulation contract, and metadata tests |
| `npm run typecheck` | TypeScript checks |
| `npm run lint` | ESLint |
| `npm run test:demo` | Browser tests against an already-built static export |
| `npm run test:e2e:smoke` | Frontend smoke tests against an already-built gateway-mode frontend |
| `npm run screenshots` | Capture the configured routes and regenerate the screenshot GIF from a running preview |
| `npm run screenshots:rebuild-gif` | Rebuild the GIF from existing PNGs |

Demo browser tests serve exported files through
[`scripts/serve-static.mjs`](scripts/serve-static.mjs). They cover consent changes,
request context, denial paths, the guided sequence, direct subpath reloads,
responsive navigation, keyboard behavior, and automated accessibility. Tests
refuse to reuse an occupied port; stop a manual preview on port 3100 before running them.
Gateway-mode smoke tests do not establish successful backend requests.

Screenshot capture defaults to `http://localhost:3100` and installed Chrome. For
the static demo, set `SCREENSHOT_BASE_URL=http://127.0.0.1:3100/Healthcare-Data-Exchange`.
Set `CI=1` to use Playwright's installed Chromium. See the
[asset guide](../docs/assets/README.md) before replacing retained images.

If local Turbopack worker-port binding is restricted, use
`npm run build:demo -- --webpack` or `npm run build -- --webpack`, followed by the
appropriate browser tests. CI uses the normal scripts. This is a build-environment
workaround, not a change to the application's runtime behavior.

Backend verification remains `./scripts/verify.sh` from the repository root.
Runtime evidence requires `./scripts/demo.sh` and `./scripts/adversarial.sh` against
a running Compose stack. Browser fixture tests do not replace these checks.

## GitHub Pages

The [Pages workflow](../.github/workflows/pages.yml) runs static checks for matching
pull requests without publishing them. On matching pushes to `main`, or a manual
workflow dispatch on `main`, successful checks produce the artifact deployed to
the `github-pages` environment. Set the repository's Pages source to **GitHub Actions**.
Preserve branch protection and required checks before merging.

Only `web/out` is uploaded. Backend services, local credentials, and service data
are not part of this artifact. The public URL is
[https://safetymp.github.io/Healthcare-Data-Exchange/](https://safetymp.github.io/Healthcare-Data-Exchange/).
Use the workflow run and the published site to distinguish a successful build
from a successful deployment. See [maintainer settings](../docs/maintainer-github-settings.md)
for repository configuration.

## Local gateway and compatibility routes

| Route | Task |
|---|---|
| `/` | Research request, pilot worksheet and selected-case technical stages |
| `/patients/` | Search synthetic patients and inspect an access decision |
| `/consent/` | Review and change purpose-specific consent |
| `/identity/` | Resolve an example identifier into patient context |
| `/activity/` | Inspect this tab's simulated decisions and consent changes |
| `/ai-triage/` | Inspect the fixed AI governance example and oversight requirement |

- [`src/lib/api.ts`](src/lib/api.ts): mode selection and gateway API adapter.
- [`src/lib/demo.ts`](src/lib/demo.ts): synthetic patients, simulated decisions, and session state.
- [`src/lib/walkthrough.ts`](src/lib/walkthrough.ts): guide steps and action matching.
- [`src/app/`](src/app/): task routes and shared providers.
- [`tests/`](tests/): unit and browser regression coverage.

The product brief and change evidence live in [docs](../docs/README.md). Follow
[CONTRIBUTING.md](../CONTRIBUTING.md) and [AGENTS.md](../AGENTS.md) for changes.
