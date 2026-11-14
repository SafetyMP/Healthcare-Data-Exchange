# Agent guide

This guide supports bounded work on Healthcare Data Exchange. Start with the
[root contract](../AGENTS.md) and the user's current request; retrieve the sections
and source files needed for that task. Existing documentation and historical
receipts describe evidence and scope, not renewed authorization.

## Product and modes

The [public demo](https://safetymp.github.io/Healthcare-Data-Exchange/) teaches
purpose-specific consent, requesting-team context, regional restrictions, and a
limited derivative example using four synthetic patients. Its guided walkthrough
uses the same patient-access and consent controls as free exploration. Checkpoints
advance from matching actions and results, rather than from a slideshow.

| Mode | Behavior | What it establishes |
|---|---|---|
| Static browser demo | `NEXT_PUBLIC_DEMO_MODE=true` at build time; synthetic fixtures, browser session state, no gateway calls | Demonstration and frontend behavior |
| Local gateway UI | Demo switch unset; `/api/*` proxies to the gateway, with verified caller credentials and admin authentication for consent writes | Actual responses from the locally running backend |
| Backend reference | Go gateway, HAPI FHIR EU/US stores, OPA, OPAL, and Python services | Only the behavior exercised by its recorded tests and runtime checks |

The static demo is not an authorization engine, health-information exchange,
clinical record system, compliance certification, or clinical AI tool. Its activity
view is a browser-session record, not a durable server audit log. The AI page
illustrates an oversight requirement; no clinical model runs in the browser demo.
The local gateway mode is also a synthetic reference, not a production service.

The [product mandate](product-mandate.md), [project overview](../README.md),
[web guide](../web/README.md), and [documentation index](README.md) provide broader
context. Architecture documents and ADRs explain the backend reference; they do
not establish that the hosted static demo runs those services.

## Start and verify the browser demo

Use Node 22 and npm 10.9.2–10.x, as specified in `web/package.json`.

```bash
cd web
npm ci
npx playwright install chromium
npm run verify:demo
npm run preview:demo
```

The preview is at `http://127.0.0.1:3100/Healthcare-Data-Exchange/`. For preview
without the browser suite, run `npm run build:demo` before `npm run preview:demo`.
Stop a manual preview before running tests: the test server deliberately refuses
to reuse an occupied port. `NEXT_PUBLIC_BASE_PATH` must agree for build, preview,
and tests if the default repository subpath changes.

`npm run verify:demo` runs adapter and metadata tests, TypeScript checking, the static export,
export metadata checks, and Playwright tests against exported files.
`npm run test:unit` is the focused adapter and metadata
contract check. Browser checks cover consent/denial flows, request context,
walkthrough recovery, routes, and accessibility. A passing suite is evidence for
those checks, not a claim about all users or all accessibility requirements.

## Task-to-source map

| Task | Owning sources | Useful verification |
|---|---|---|
| Orientation and navigation | `web/src/app/page.tsx`, `web/src/components/layout/app-shell.tsx`, `web/src/lib/navigation.ts` | Desktop/mobile navigation, keyboard use, static route reload |
| Access decisions and consent | `web/src/app/patients/page.tsx`, `web/src/app/consent/page.tsx`, `web/src/components/clinical/patient-selector.tsx`, `web/src/components/clinical/use-access-context.ts` | Preserve patient, purpose, and explicit requester across routes; grant/revoke and retry |
| Guided walkthrough | `web/src/lib/walkthrough.ts`, `web/src/components/walkthrough/guided-walkthrough.tsx` | Matching-action progression, pause/resume, reload, reset, mobile and keyboard flow |
| Simulation and API contracts | `web/src/lib/demo.ts`, `web/src/lib/api.ts`, `web/tests/unit/api.test.mjs` | No demo network calls, consent separation, allow/deny paths, minimum fields, live payload/auth mapping |
| Identity, activity, oversight | Corresponding routes in `web/src/app/` | Readable errors, context handoff, accurate synthetic labels, no invented clinical decisions |
| Visual system | `web/src/app/globals.css`, existing UI/layout components | Responsive layout, contrast, focus, reduced motion |
| Export and publication | `web/next.config.ts`, `web/scripts/serve-static.mjs`, `.github/workflows/pages.yml` | Subpath assets and direct route reloads, reviewed artifact, deployed commit verification |
| Discovery and documentation | Root `README.md`, `llms.txt`, `web/public/llms.txt`, `docs/`, page metadata | Link/metadata checks; identical index copies; correct mode claims |
| Live authorization and routing | `services/gateway/`, `policy/`, `config/` | Hermetic checks plus Compose cooperative and adversarial gates |
| Live consent and identity | `services/consent-service/`, `services/identity-broker/` | Service tests and actual gateway/OPAL runtime flows |

Retain Next.js, React, TypeScript, Tailwind, the existing Go module, and the Python
service configurations. Do not add a replacement stack or bypass checks for a
documentation or interface task. Path-specific conventions are in
[`.github/instructions/`](../.github/instructions/).

## Routes and state

Static routes sit below `/Healthcare-Data-Exchange`; local gateway-mode routes sit
at the domain root.

| Route | User task |
|---|---|
| `/` | Understand the demonstration, start/resume the guided walkthrough, or choose a scenario |
| `/patients/` | Select a synthetic patient, purpose, and requesting team; check access |
| `/consent/` | Inspect purpose-specific consent, change it, and return to the same request context |
| `/identity/` | Resolve an existing synthetic identifier or patient ID |
| `/activity/` | Inspect this tab's simulated requests and consent changes |
| `/ai-triage/` | Inspect the synthetic governance/oversight example |

Starting or restarting the walkthrough resets demo consent and activity; resuming
does not. Reset restores initial demo state and clears walkthrough context.
Session storage holds synthetic state and validated preset identifiers. It never
holds live bearer or admin tokens. Named demo credentials in the source are public
fixtures, not deployment secrets. If storage is unavailable, persistence across reload
is not guaranteed. URL parameters are navigation context only, never live identity.
Preserve requester context after a consent round trip and invalidate stale results
when request parameters or consent change.

## Local backend reference

Follow [the root setup guide](../README.md) for Docker, Go, Python, and PyYAML
prerequisites. The frontend can be used without Docker in static mode.

```bash
# From the repository root:
./scripts/verify.sh
./scripts/run-dev.sh
./scripts/demo.sh
./scripts/adversarial.sh
# In a separate terminal, from the repository root:
cd web
npm run dev
```

Keep `NEXT_PUBLIC_DEMO_MODE` unset for gateway mode. The UI runs on port 3100 and
proxies `/api/*` to `CHEX_GATEWAY_URL`, default `http://127.0.0.1:8081`. Rebuild when
switching modes. A missing backend must produce an unavailable state, never a
successful fixture fallback. Run `cd web && npm run verify` for gateway-mode UI
checks. Tear down an owned stack with `./scripts/teardown-dev.sh`; its `--volumes`
option deletes database volumes and is not an ordinary cleanup default.

The first hermetic verify can create service `.venv` directories and download OPA
to `.tools/bin/`. The first backend startup writes gitignored OPAL development
secrets; do not read or print them. HAPI startup can take more than two minutes
per cell. `run-dev.sh --down-first` recycles the stack; use it only within the
current authorized runtime scope. Never restart retained stopped jobs by inference.

| Root command | Purpose |
|---|---|
| `./scripts/verify.sh` | Repository Definition of Done and stop-hook gate: harness, Go, Python, OPA; no Compose runtime proof |
| `./scripts/demo.sh` | Cooperative end-to-end scenarios against the running Compose stack |
| `./scripts/adversarial.sh` | Adversarial authentication/residency checks against that stack |
| `./scripts/sync-policy-repo.sh` | Existing canonical-to-mirror policy synchronization after authorized Rego edits |
| `./scripts/check-portfolio.sh` | Portfolio contract and policy-mirror drift |
| `./scripts/check-harness.sh` | Structural checks for retained harness and corporate/site overlay |

Live consent decisions consume OPAL's `data.consent`, not a request-supplied flag.
This repository owns `policy/`; `healthcare-policy` is a mirror. After Rego changes,
run the existing sync script before the runtime demo or claiming current OPAL
policy. Preserve the [threat model](adr/0000-threat-model.md), its
[machine-readable scope](../specs/threat-model.yaml), and fail-closed tests.

## Safety, authority, and delivery

No real PHI or private credentials belong in this repository, public artifacts,
browser forms, logs, or issue discussions. Never read or print `.env` values,
`deploy/opal/dev-secrets.env`, or OPAL keys. Patient-read authorization derives from
verified per-cell credentials; a query parameter cannot establish jurisdiction.
Do not weaken human oversight, tenancy, or minimum-necessary restrictions.

Preserve existing edits, evidence, pins, `.harness/`, and `.corp-harness/`. Historical
phase-3 work remains halted in [the mandate](../specs/MANDATE.md). New scoped work
does not resume it or any archived Ecosystem, Frontier, or C02 runtime. Applicable
corporate handoffs and digest rules remain in the
[factory overlay](factory-overlay.md); never alter approval state or self-approve.
Retained Cursor hooks are historical/integration tooling, not a requirement to
replace native agent tools. Their hook interface remains
`python3 .cursor/hooks/<hook>.py < payload.json`; avoid blocked shell patterns in
guard tests rather than bypassing the guard.

Publish through the existing Pages workflow and required PR/branch gates; PR
checks do not publish. The artifact is `web/out`, not the backend or local secrets.
Report local checks, remote CI, deployment, and live browser verification as
separate observations. Preserve certification and production-readiness limits.

The two matching `llms.txt` files provide a small public reading index. This is a
supplemental emerging proposal, not a search-engine standard or a guarantee of
indexing, ranking, model ingestion, or citations. See
[discovery documentation](discoverability.md). It supplements navigable human
documentation; it does not replace it or authorize agent actions.
