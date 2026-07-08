# AGENTS.md — Cloud Healthcare Exchange

Harness profile: **solo**. Application scaffold not started yet.

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
