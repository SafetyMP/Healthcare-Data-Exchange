# MANDATE — current delivery and historical phase 3

## Current delivery: experience redesign (2026-11-14)

Status: IMPLEMENTED; publication is tracked by the Pages workflow. The user's explicit request to redesign
Healthcare Data Exchange and host a GitHub Pages demo authorizes this new work.
The historical phase-3 fleet below remains halted; no historical runtime is resumed.

Scope: redesign the existing Next.js console around synthetic patient access,
consent and understandable decisions; retain live gateway mode; add an isolated
browser-local simulation and GitHub Pages static export; publish and verify demo.
No policy, gateway, identity, consent-service or archived harness changes.

Ownership: coordinator owns visual system, shell, overview and integration.
Scoped native workers may own demo adapter, workflow pages, deployment/tests,
and read-only independent review in disjoint paths. No corporate approval state changes.

Acceptance: selection and search; readable allowed/denied access; consent
grant/revoke and retry; clear simulation labels and reset; no demo API traffic;
mobile and keyboard usability; typecheck, build, meaningful browser checks,
independent review, required repository checks, and deployed Pages verification.
Simulation checks are not live OPA, OPAL, HAPI or clinical validation.

## Follow-up: independent live experience review (2026-11-14)

The user explicitly requests independent agents to review the published demo,
fix remaining usability, visual and workflow friction, and update GitHub Pages.
This authorizes the current follow-up only; historical fleet state remains halted.
Reviewers inspect the baseline independently through coordinator-captured live
screenshots, accessibility trees and reviewer-directed keyboard sequences. Subagent
browser access was unavailable; the Safari fallback timed out before interaction.
Source and captured-evidence review proceed concurrently. Implementers own disjoint
frontend paths.

Acceptance: record reproduced findings and scope decisions; resolve actionable
issues without changing backend authorization; add focused regression checks;
independently review the fixes; pass frontend and required remote checks including
CodeQL; deploy the reviewed commit and verify its public behavior.

## Follow-up: in-app guided walkthrough (2026-11-14)

The user explicitly requests a first-use guided walkthrough for consent, requesting
teams and regional access, followed by a GitHub Pages update. This authorizes a
frontend-only guide integrated with the existing synthetic forms. Historical
fleet and backend authorization remain unchanged.

Acceptance: discoverable start; clear reset disclosure; real action/result-driven
progress; consent grant/revoke and purpose separation; requester preservation on
consent round trips; regional denial and limited derivative example; pause/resume,
reload and reset recovery; keyboard and mobile usability; no guide in live gateway
mode; independent review, relevant local/remote tests, and verified Pages deployment.
Native implementers use disjoint files; coordinator owns shell/page integration.

---

# Historical multi-agent contract (phase 3; preserved)

Status: HALTED  
Signed: phase-3-parallel-2026-07-08  
Halted: phase-3-complete-2026-07-08  
Integration executor: parent agent (integration owner on `main`)  
Verify gate: `./scripts/verify.sh`

---

## Phase

**Phase 3** — US second cell + cross-bloc exception demo (parallel tracks). **Complete** on `main` (verify + demo green).

Reopen with `proceed` and a new mandate scope before spawning parallel child tracks again.

---

## Ownership (archived)

| Track | Branch | Paths | Agent role |
|-------|--------|-------|------------|
| `us-cell` | `agent/us-cell` | `deploy/docker-compose.yml` (US services), `fhir/samples/us/`, US jurisdiction in `config/routing.yaml` | Child — merged |
| `gateway-policy` | `agent/gateway-policy` | `services/gateway/`, `config/routing.yaml` (identity broker), gateway tests | Child — merged |
| `policy` | `agent/policy` | `policy/` (cross-bloc Rego + tests) | Child — merged |
| `integrate` | `main` | `scripts/demo.sh`, `scripts/run-dev.sh`, `scripts/verify.sh`, `docs/`, merge | Parent — done |

### Boundaries (when ACTIVE)

- Children: package-level tests for their paths only; **no** `./scripts/demo.sh` or `docker compose` from worktrees.
- Parent: merge child branches, resolve conflicts, run verify + demo from **main repo root**.
- Shared file `config/routing.yaml`: **gateway-policy** owns broker/routing keys; **us-cell** appends US jurisdiction + subjects only via parent merge.

---

## Worktrees

```bash
./scripts/setup-phase3-worktrees.sh    # create (historical)
./scripts/teardown-phase3-worktrees.sh # remove after merge
```

---

## Human oracles

| Instruction | Agent behavior |
|-------------|----------------|
| `stop` / `halt` | No mutating edits; debrief only |
| `negotiate` | Edits under `specs/` only until `proceed` |
| `proceed` / `execute` | Implement within mandate scope; verify before claiming done |

Precedence: `~/.cursor/specs/constitution.md`, then this file, then `docs/product-mandate.md`.

---

## HALTED

Set `Status: HALTED` and commit on `main` to freeze implementation fleet-wide until user reopens with `proceed` and scope.
