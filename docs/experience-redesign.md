# Patient access experience redesign

The November 14, 2026 request authorizes an experience redesign and a GitHub Pages
demo. The original product mandate centers on minimum-necessary access, regional
residency, and transparent consent. The old console presented separate technical
forms, repeated patient identifiers, and raw JSON results. These are source-based
friction hypotheses, not findings from a user study or analytics.

## Resulting experience

The overview gives visitors one clear starting task and a short consent scenario.
A searchable four-patient roster carries patient context into consent. Purpose and
requesting-team choices lead to a readable decision; only returned fields appear in
the result. Technical payloads remain available in disclosures. Identity matching
uses actual registered examples, while AI oversight is explicitly a fixed governance
example. Session activity explains decisions and consent changes. Reset restores
starting fixtures. A responsive, keyboard-operable workspace replaces the modal
mobile navigation.

The existing Next.js/React/TypeScript stack is retained. A compile-time demo flag
selects the browser simulation and static export; server mode retains its gateway
rewrite. The static build serves under `/Healthcare-Data-Exchange/`, including
nested route reloads. No backend, policy, mirror, or archived runtime is modified.

## Evidence boundaries

- Synthetic patient fields come from `fhir/samples/`; initial purpose consent comes
  from the consent-service fixture state. The simplified decisions illustrate
  existing policy rules; they are not a second production authorization engine.
- Browser simulation does not call OPA, OPAL, HAPI, or a clinical model. It cannot
  establish actual residency, live revocation propagation, security certification,
  or clinical suitability.
- Live identity and AI request payload mappings were corrected to match the existing
  gateway contract. Authentication requirements remain enforced by the backend.
- Local functional and accessibility tests establish only the exercised scenarios.
  Whether the redesign improves real customer engagement still requires user testing.

## Verification

Run `npm run verify:demo` in `web` for static build, browser interactions, direct
subpath reloads, mobile layout/navigation and automated accessibility checks. Run
`npm run verify` for the gateway-mode build and smoke checks. API unit checks cover
simulation denies, consent transitions, reset/persistence, no-network behavior and
live request/error contracts.

The repository's `scripts/verify.sh` passed locally with 19 OPA tests, all nine Go
packages, and 17 Python tests, plus static checks. macOS rejected the installed
Go 1.22 internal-linker binaries (`missing LC_UUID`); the invocation-only workaround
was `GOFLAGS='-p=4 -ldflags=-linkmode=external' GOMAXPROCS=4 ./scripts/verify.sh`.
No source changes were needed for that workaround. Full Compose scenarios are
separately checked by the required GitHub `demo-e2e` workflow.

Next.js and its ESLint configuration were updated to 16.4.6 and Zod was refreshed
to remove the installed high/critical audit findings. ESLint 9.39.5 satisfies the
existing plugins' peer ranges. The production-only audit reports zero vulnerabilities. Eight moderate development-tool findings remain in
the transitive minimatch chain; no audit force upgrade or major override was applied.

Independent review identified lost patient context during sidebar navigation,
unhelpful live denial messages, and stale results after browser history navigation.
All were corrected and closed by independent source review with regression coverage.

Final local checks passed: ESLint, nine adapter unit tests, typecheck, static export,
19 browser checks including history regressions, and the
server-mode build with two smoke/accessibility checks. GitHub CI and the Pages
workflow are the authoritative remote build and deployment records.
