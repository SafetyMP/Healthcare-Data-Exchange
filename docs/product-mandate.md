# Healthcare Data Exchange — product scope

**Status:** Current product and contribution scope

**Updated:** November 14, 2026

**Try it:** [Live guided demo](https://safetymp.github.io/Healthcare-Data-Exchange/)

## Purpose

Help people understand how consent, requesting-team permissions, purpose, and
regional restrictions combine to determine access to healthcare data. The product
is a guided, synthetic learning workspace with readable decisions and a visible
trail of the actions that produced them.

The browser experience is the first entry point. A separate local reference
backend uses FHIR R4, HAPI stores, a Go gateway, OPA, and OPAL to investigate service
behavior. Both modes use synthetic data. Neither is a production health
information exchange or a clinical record system.

This scope replaces the earlier broad Cloud Healthcare Exchange vision as the
active product brief. The [original mandate remains available in history](https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/bae1c21d9b3bbb5faf98d660ea39bf68d44f9e34/docs/product-mandate.md),
along with the ADRs and earlier delivery records. Historical plans do not establish
implemented capabilities or authorize new deployments.

## Who this serves

| Audience | Task the project should support |
|---|---|
| First-time visitors and learners | Complete a coherent scenario without credentials, internal IDs, or infrastructure setup |
| Product and design reviewers | Inspect patient context, decision explanations, consent changes, recovery paths, and accessibility |
| Frontend developers | Reproduce the browser demo, change interactions, and verify behavior under the Pages subpath |
| Backend and interoperability developers | Inspect synthetic FHIR access, credential-bound identity, policy decisions, and consent distribution in a local stack |
| Security and governance reviewers | Distinguish demonstrated behavior, stubbed capabilities, assumptions, and untested claims |

Clinicians and patients may provide valuable design feedback, but the project does
not deliver care, manage real consent, or process their records.

## Core experience

1. **Find the patient.** Search a small synthetic roster and retain the selected
   patient across related tasks. Use example identifiers for identity matching.
2. **Set the request context.** Make purpose and requesting team explicit. A team
   preset simulates caller context in the browser; backend identity still comes
   from verified credentials.
3. **Understand the decision.** Show whether access is allowed, limited, denied,
   or unavailable; explain the reason and display only the fields returned by the
   decision. Keep technical payloads available as secondary detail.
4. **Explore consent.** Review purpose-specific preferences, save a change, and
   check the same request again. Preserve the requester when moving between pages.
5. **Inspect boundaries.** Show that consent does not override region restrictions,
   and that the derivative exception requires the permitted requesting team.
6. **Review the trail.** Record simulated requests and changes in the current tab,
   with enough context to understand why outcomes differ.

The optional [nine-checkpoint guide](guided-walkthrough.md) teaches this sequence
through actual form actions. It starts only when requested, waits for matching
results, and supports pause, resume, restart, and reset. Identity matching and the
fixed AI oversight example support exploration without displacing the access and
consent workflow.

## Product principles

- **Context before mechanics.** Lead with the user's task and decision. Explain
  backend terminology where it helps, without requiring it for the first journey.
- **Visible consequences.** Show what changed after consent or requester changes.
  Clear stale results when the request context changes.
- **Purpose-specific consent.** Treatment, research, and limited sharing examples
  have distinct rules; success in one scenario is not continuing permission.
- **Accessible control.** Support keyboard navigation, readable status messages,
  responsive layouts, and recovery after navigation or reload.
- **Honest simulation.** Label the browser mode, use synthetic fixtures, and keep
  session activity distinct from a production audit log.
- **Preserved backend boundaries.** The frontend does not weaken credentials,
  residency checks, policy sync, or human-oversight requirements in the reference stack.
- **Evidence matched to claims.** A successful build, browser test, backend test,
  deployment, and user study answer different questions.

## Acceptance and evidence

| Product requirement | Appropriate check |
|---|---|
| Visitors can complete the intended sequence | Browser test through all nine checkpoints; direct review of the journey |
| Decisions and consent transitions remain consistent | Fixture adapter tests and scenario tests for allowed, denied, revoked, and limited outcomes |
| Request context survives navigation | Patient/purpose/team round-trip and browser-history tests |
| Guide progress follows actual actions | Tests for wrong context, ordered actions, pause/resume, reload, and reset |
| Static hosting works | Build/export, nested route reloads, no gateway traffic, and inspection of the published Pages site |
| Interface is usable across input and viewport sizes | Keyboard and responsive review plus automated accessibility checks; these do not replace assistive-technology testing |
| Backend behavior is maintained | Hermetic checks plus separate cooperative and adversarial Compose scenarios when backend/runtime claims are made |
| The experience helps real users | Future user research; expert inspection and synthetic tests do not establish engagement or learning outcomes |

See [experience redesign](experience-redesign.md), [live review](live-experience-review.md),
and [walkthrough evidence](guided-walkthrough.md) for bounded results. Current
remote run status belongs in [GitHub Actions](https://github.com/SafetyMP/Healthcare-Data-Exchange/actions).

## Boundaries and next decisions

Out of scope are real patient data, clinical recommendations, production identity
federation, production consent administration, clinical AI, security certification,
and claims of legal compliance or deployment hardening. Browser simulation cannot
prove live OPA/OPAL enforcement or actual regional data residency. The local
backend retains development credentials, stubs, and its documented threat model.

Future work should address an observed user need and define how its result will be
assessed. Production exchange, regulatory authorization, provider integration, and
broader deployment require their own scope and evidence; they are not implied by
this demo. See the [roadmap](roadmap.md) for proposed work and
[architecture](architecture/overview.md) for current implementation boundaries.
