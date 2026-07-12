# Cloud Healthcare Exchange — Web UI

Reference clinician console for gateway demos. Synthetic data only.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 with three-layer design tokens (primitive → semantic → component)
- BFF proxy: browser calls `/api/*` → gateway (`CHEX_GATEWAY_URL`, default `http://127.0.0.1:8081`)

## Commands

```bash
cd web
npm install
npm run dev          # http://localhost:3100
npm run verify       # typecheck + build + @smoke Playwright + axe-core
```

Start the backend first from repo root: `./scripts/run-dev.sh`

Regenerate README screenshots: `npm run build && npm run start` then `npm run screenshots` (see [`docs/assets/README.md`](../docs/assets/README.md)).

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Overview and workflow index |
| `/patients` | Policy-gated FHIR patient read |
| `/consent` | Admin consent grant/revoke |
| `/ai-triage` | AI governance triage stub |
| `/identity` | Identifier resolve demo |
