# Historical walkthrough design — November 14, 2026

This document records the earlier guided forms. The public product now starts with the consent research case and follows the same request into a compact technical guide. [Current case and technical evidence](exchange-operations.md)

The user requested an in-app guide for first-time visitors to the published
synthetic demo. The existing forms and decisions remain the learning surface.
This is a frontend-only change; no backend authorization or policy is modified.

## Experience

Overview exposes a guided start next to free exploration and in the scenario card.
Task routes expose a compact introduction when no guide is active. Starting or
restarting explicitly discloses resetting this tab's simulated consent and activity.
The guide never starts automatically.

Nine checkpoints cover research denial, grant and recheck, revoke and recheck,
separate treatment access, US-to-EU regional denial, unchanged granted consent
with the same requester still denied, an unauthorized derivative request, the
permitted limited derivative, and Activity review.

The panel describes the next action and expected result. Actual form results
report a small typed event containing only synthetic patient ID, purpose, preset,
result and reduced-response status. Progress requires an exact match and ordered
save-then-check actions where relevant. Next remains a deliberate user action.
Historical activity is not replayed to unlock a checkpoint. The guide does not
perform consent writes or access requests itself.

Pause preserves the checkpoint and ignores intervening actions. Validated session
storage restores progress after reload. Reset clears progress. Return links restore
the intended form context through normal navigation; they do not alter consent.
A result-bound continuation beside access outcomes reduces mobile scrolling, while
Show the controls focuses the relevant form. Explicit step navigation focuses the
guide heading. All guide UI is absent from live-gateway mode.

## Review and verification

An independent design reviewer assessed the teaching sequence and action matching.
A separate source reviewer caught an explanation that claimed research remained
revoked even after off-script exploration; the explanation now states only the
observed treatment result and the purpose-specific principle. Source review found
no remaining blockers after that correction. An independent visual reviewer
approved the desktop and mobile captures. Its optional plain-language suggestion
was applied to the recovery hint.

Local validation: ESLint; TypeScript/static webpack build; 9 unit tests; all 37
browser tests, including the complete nine-step journey, no API traffic, wrong
patient/purpose/team/action, same-route recovery, pause/resume, reload, restart,
reset, malformed progress, mobile keyboard access, and automated accessibility.
Coordinator browser inspection confirmed mobile control focus and nearby continuation.
Live-mode webpack build and both smoke tests passed, including absence of guide UI.
Hermetic checks passed: OPA 19/19, 9 Go test packages (cached), 17 Python tests,
lint and repository contract checks. Local webpack is used because Turbopack
worker-port binding is restricted; CI retains its normal Turbopack workflow.

Remote checks, deployment and public verification are tracked on the delivery PR.
Synthetic browser checks do not establish customer outcomes, clinical validity or
live backend policy enforcement. Screen-reader speech was not measured.
