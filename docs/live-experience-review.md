# Independent live experience review — November 14, 2026

Baseline: deployed commit `04f9ea84f9368d98db5a7696825c9baa5c620378`,
[GitHub Pages demo](https://safetymp.github.io/Healthcare-Data-Exchange/).
The user requested independent agents to review the live demo, fix remaining
usability, visual and workflow friction, and publish the corrections.

## Review method

Three fresh reviewers independently examine workflow, visual comprehension, and
keyboard/navigation behavior. They do not implement the fixes. Subagent browser
access was unavailable, and a native Safari fallback timed out before interaction.
The coordinator captured all six deployed routes at 1280 x 720 and executed the
keyboard reviewer's exact identity, AI/reset and mobile-menu sequences (390 x 844).
Reviewers independently assessed those screenshots, accessibility trees and focus
traces. They did not directly operate the live browser. Source-only inferences and
live observations are distinguished below. This is an expert
inspection, not a customer usability study or evidence of improved engagement.

## Findings and decisions

- **Requester context loss (coordinator, reproduced live):** Anna / treatment /
  US home team is blocked by residency. Following Review consent, saving the
  already-granted preference and returning to Patient access silently switches to
  the EU visiting team; the next check is allowed. Preserve validated requester
  presets and purpose through navigation; show recovery appropriate to the reason.
  Backend credential verification is unchanged.
- **Undersized supporting type (visual reviewer, six deployed screenshots + source):**
  much of the overview uses 8–11px text. Increase substantive copy to 14px and
  secondary metadata to at least 12px while retaining the established palette.
- **Misleading workspace switcher (visual reviewer, source + screenshot):** an
  inert workspace badge has a dropdown chevron. Remove the false affordance.
- **Inaccurate action copy (visual reviewer, deployed accessibility tree):** selecting a patient opens
  a form; it does not start an access request. State the actual next step.
- **Navigation reachability (visual reviewer, deployed screenshots + source):** the fixed desktop sidebar
  lacks overflow behavior, and mobile navigation omits documentation. Make the
  sidebar scrollable and documentation available in mobile navigation.
- **Keyboard disclosure behavior (keyboard reviewer, reviewer-directed live focus traces):** mobile menu needs current-route indication, Escape dismissal and
  reliable focus after navigation. Keep it a nonmodal disclosure with natural
  Tab order.

- **Displayed identifier search (workflow reviewer, reproduced live by coordinator):**
  searching `EU-001-TEST` returns no matches despite that identifier appearing on
  Anna's row. Include the displayed identifier in search.
- **Activity explanation (workflow reviewer, source):** access activity omits the
  requesting team. Include readable preset names in every simulated access outcome.
- **History restoration race (independent source reviewer):** a region-default effect
  could overwrite an explicit requester restored by history. Resolve context without
  competing effects and test cross-region history navigation.

The identity Enter/Tab path reached the matching record and access link in natural
order. AI reset cleared its output and restored the selected patient; custom example
text remained, consistent with the stated reset scope. No change was needed there.

## Fix review and local verification

All actionable findings above are addressed. Automatic requester defaults remain
regional until a team is explicitly selected; consent return links preserve the
complete request. Public history writes keep Next.js routing synchronized. The
independent source reviewer found no remaining blockers after these corrections.
The independent visual reviewer approved desktop and mobile captures; its optional
mobile metric-alignment suggestion was also applied.

- ESLint and TypeScript: passed.
- Unit tests: 9 passed, including fixture decisions and live API contracts.
- Static browser suite: 32 passed (20 existing, 12 new), including consent round
  trips, requester-specific activity, search, history/back/forward, reset, real
  keyboard navigation, sidebar reachability at 1280 x 480, responsive layouts at
  390/768/1024/1280px, and automated accessibility checks on key response states.
- Live-mode webpack build and 2 smoke tests: passed.
- Coordinator browser check: Escape closes mobile navigation and restores its
  toggle; same-page navigation focuses the main content.
- Hermetic verification: OPA 19/19; 9 Go test packages; 17 Python tests; lint,
  harness, portfolio, threat-model and policy-stamp checks passed. Go results were
  cached. No local Compose run was claimed.
- Local static build used Next.js webpack because Turbopack's worker-port binding
  was blocked in this environment. The unchanged Pages workflow uses its normal
  Turbopack build; remote checks and deployment are tracked on the pull request.

These are expert-review and synthetic regression results. Actual screen-reader
speech, customer engagement and clinical/backend policy enforcement were not
validated by the browser-local demo.
