# MANDATE — multi-agent contract (phase 3)

Status: ACTIVE  
Signed: phase-3-parallel-2026-07-08  
Integration executor: parent agent (integration owner on `main`)  
Verify gate: `./scripts/verify.sh`

---

## Phase

**Phase 3** — US second cell + cross-bloc exception demo (parallel tracks).

Parent integrates on `main`, runs `./scripts/verify.sh` and `./scripts/demo.sh`. Do not trust child integration claims.

---

## Ownership

| Track | Branch (suggested) | Paths | Agent role |
|-------|-------------------|-------|------------|
| `us-cell` | `agent/us-cell` | `deploy/docker-compose.yml` (US services), `fhir/samples/us/`, US jurisdiction in `config/routing.yaml` | Child — add US HAPI + Postgres cell only |
| `gateway-policy` | `agent/gateway-policy` | `services/gateway/`, `config/routing.yaml` (identity broker), gateway tests | Child — routing + broker; no compose US block edits |
| `policy` | `agent/policy` | `policy/` (cross-bloc Rego + tests) | Child — policy only |
| `integrate` | `main` | `scripts/demo.sh`, `scripts/run-dev.sh`, `scripts/verify.sh`, `docs/`, merge | Parent only |

### Boundaries

- Children: package-level tests for their paths only; **no** `./scripts/demo.sh` or `docker compose` from worktrees.
- Parent: merge child branches, resolve conflicts, run verify + demo from **main repo root**.
- Shared file `config/routing.yaml`: **gateway-policy** owns broker/routing keys; **us-cell** may append US jurisdiction + subjects only via parent merge coordination (prefer gateway-policy merges routing structure first).

---

## Worktrees (optional)

From repo root after pulling this mandate:

```bash
./scripts/setup-phase3-worktrees.sh
```

Opens sibling directories with isolated branches. One Cursor chat (or cloud agent) per worktree.

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
