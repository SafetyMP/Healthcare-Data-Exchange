---
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript coding standards

- Write TypeScript, not new application JavaScript. Leave existing tooling `.js` / `.mjs` / `.cjs` files alone.
- Place imports at the top of the module. Do not use inline `import()` in function bodies except for a documented circular-dependency or optional-runtime case.
- Prefer early returns over nested conditionals.
- On `switch` over a discriminated union or enum, handle every variant. Use a `never` check in `default` so newly added variants fail at compile time.
- Do not introduce `any` in new production code. Prefer `unknown` plus narrowing. Do not use non-null assertions to silence `strict` or `noUncheckedIndexedAccess`.
- Match this repository's existing formatter and linter. Do not add a second style system.
- Keep public unions narrow. Do not widen a literal union to `string` without a spec change.
- Do not weaken fail-closed, human-in-the-loop, tenancy, or verify gates to make types compile.

## This repository

- `web/` is the guided synthetic-demo workspace and local gateway UI. Retain Next.js,
  React, TypeScript, and Tailwind; use the existing components and visual tokens.
- `NEXT_PUBLIC_DEMO_MODE=true` selects the browser simulation at build time. Keep it
  isolated from live `/api` requests; do not fall back to fixture success on network errors.
- Patient, purpose, and requester presets are navigation context, never live authorization.
  Keep explicit requester choices through consent round trips and invalidate stale results.
- Store synthetic session state and validated presets only; never store live bearer/admin tokens.
- Walkthrough checkpoints must match actual actions/results. Preserve pause/resume,
  reset/reload behavior, keyboard access, and the absence of the guide in live mode.
- `cd web && npm run verify:demo` checks the static demo; `cd web && npm run verify`
  checks gateway-mode UI. Neither proves backend policy or clinical correctness.
