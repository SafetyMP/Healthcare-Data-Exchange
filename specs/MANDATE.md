# MANDATE — multi-agent contract (phase 3)

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
