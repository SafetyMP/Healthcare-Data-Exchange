# Healthcare Data Exchange roadmap

**Updated:** November 14, 2026

The current direction is a guided synthetic experience that makes consent,
requesting-team permissions, purpose, and regional restrictions understandable.
The separate local FHIR/OPA/OPAL backend remains a reference for implementation
experiments. Start with the [live demo](https://safetymp.github.io/Healthcare-Data-Exchange/)
and [product scope](product-mandate.md).

This roadmap distinguishes delivered capabilities from proposed work. Proposals
are not scheduled commitments or authorization to execute a study, integration,
publication campaign, or production rollout.

## Delivered experience

| Capability | What is available | Source and evidence |
|---|---|---|
| Public browser demo | Static GitHub Pages workspace with four synthetic patients; no account or backend setup | [Frontend guide](../web/README.md), [Pages workflow](../.github/workflows/pages.yml) |
| Patient access and consent | Search, purpose/team context, readable allowed/limited/blocked outcomes, grant/revoke and recheck | [Experience redesign](experience-redesign.md), [fixture adapter](../web/src/lib/demo.ts) |
| Guided learning | Nine checkpoints across consent, separate treatment access, regional restrictions, limited sharing, and Activity | [Walkthrough design and checks](guided-walkthrough.md) |
| Context and recovery | Patient/purpose/team continuity, browser history, pause/resume, reload, and reset | [Independent experience review](live-experience-review.md), [browser tests](../web/tests/e2e/) |
| Supporting examples | Synthetic identifier matching and a fixed AI oversight demonstration | [Frontend routes](../web/README.md#routes-and-source-map) |
| Reference backend | EU/US HAPI stores, credential-bound gateway requests, OPA policy and OPAL consent distribution | [Architecture](architecture/overview.md), [backend checks](../README.md#verification-and-evidence) |

Delivered code and test coverage do not establish customer engagement, clinical
usefulness, or real deployment safety. The browser demo uses simplified fixture
decisions. Historical backend test results retain the scope and date of their
own evidence; current runtime claims need a current stack run.

## Proposed next work

| Proposal | Question to resolve | Evidence needed before calling it successful |
|---|---|---|
| First-visit usability study | Can visitors explain why consent changes one request but not a regional denial? | An explicitly scoped study with observable task outcomes, misunderstandings, and documented limitations |
| Assistive-technology review | Do announcements, focus movement, and guide progression make sense beyond automated checks? | Manual screen-reader and keyboard review of the complete journey; fixes tied to observed issues |
| Improve recovery explanations | Can visitors identify a valid next step when a request is blocked or the gateway is unavailable? | Specific confusing cases, revised copy/interactions, and regression checks preserving request context |
| Fixture/backend correspondence | Which teaching examples match backend rules, and where is the simplified model intentionally different? | A maintained scenario mapping with separate browser tests and backend contract/runtime evidence |
| Maintain reproducible onboarding | Can a new contributor run the appropriate mode and checks using only the documented setup? | A fresh-environment rehearsal, version/dependency checks, and corrected instructions |

Choose work based on a concrete need and available evidence. Broader interoperability,
new scenarios, or additional infrastructure should follow a separately reviewed
scope rather than expand the demo by default.

## Work outside this roadmap

Production identity federation, provider connections, real patient records,
clinical AI, regulatory authorization, HSM/KMS deployment, and production hosting
are not active delivery commitments. Earlier regulatory calendars and ATO or
infrastructure ambitions are historical context, not present project deadlines.

## Historical roadmap and decisions

The [July roadmap is preserved at commit bae1c21](https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/bae1c21d9b3bbb5faf98d660ea39bf68d44f9e34/docs/roadmap.md).
It records earlier phases, regulatory assumptions, and production-target proposals.
Those statements have not been adopted as current legal guidance or current
implementation status by this rewrite.

The [historical implementation plan](plan.md), [ADRs](adr/), and
[delivery mandate history](../specs/MANDATE.md) remain available for provenance.
For active work use [AGENTS.md](../AGENTS.md), [CONTRIBUTING.md](../CONTRIBUTING.md),
and the [current product scope](product-mandate.md).
