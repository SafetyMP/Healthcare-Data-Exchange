# AGENTS.md — Cloud Healthcare Exchange

Harness profile: **solo** — phase 1 docs complete; see `docs/plan.md` for phase 2 slice work.

## Commands

| Command | Purpose |
|---------|---------|
| `./scripts/check-harness.sh` | Validate harness files and hook syntax |
| `./scripts/verify.sh` | Definition of Done |

## Definition of Done

```bash
./scripts/verify.sh
```

When application code exists, extend `scripts/verify.sh` with real lint/test/build commands from CI — do not invent commands.

## Cloud agents

- Guards are vendored under `.cursor/hooks/` (cloud agents do not see user-level hooks).
- `stop` / verify-on-stop works in the IDE only; cloud agents must run `./scripts/verify.sh` and rely on CI (`harness-check` workflow).
- Repo must have a git remote linked in [cursor.com/dashboard](https://cursor.com/dashboard) before `/in-cloud`.

## Coding rules

- Smallest correct diff; match existing conventions once app code lands.
- Never read or print `.env` contents.

## Cursor Cloud specific instructions

- No dependencies to install: this repo is a harness scaffold that runs only on `bash` + system `python3` (stdlib only; hooks import just `os`/`re`/`sys`/etc. and the local `.cursor/hooks/_common.py`). The startup update script is intentionally a no-op.
- There is no application/server to run yet. The authoritative product plan is `docs/plan.md`. Runnable harness: `./scripts/verify.sh` and guard hooks under `.cursor/hooks/`.
- Hooks read a JSON payload on stdin and print a decision, e.g. `python3 .cursor/hooks/guard-shell.py < payload.json`.
- Gotcha: `guard-shell.py` runs live in the agent's own session, so any shell command whose text contains a blocked pattern (e.g. a recursive-delete or force-push string) is rejected before it runs — even inside `echo`, comments, or test labels. When exercising the guards, put trigger strings in payload files and pipe them via stdin instead of embedding them on the command line.
