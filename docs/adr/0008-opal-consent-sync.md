# ADR 0008: Dynamic Consent Sync with OPAL

**Status:** Accepted
**Date:** 2026-07-08
**Product:** Cloud Healthcare Exchange

> Companion to **ADR 0007 (OPAL policy-mirror repository)**, which covers the
> two-repo split OPAL polls for policy. This ADR covers the **consent data**
> mechanism and the runtime revocation flow.

## Context

GDPR Art. 7(3) gives data subjects the right to withdraw consent "at any time,"
and withdrawal must be "as easy" as giving it. EHDS primary/secondary-use flows
assume consent (or another lawful basis) is checked at access time. In the
phase 2/3 walking skeleton, consent was **static**: a `consent_research` flag in
`config/routing.yaml`, baked into the policy request input. Revoking consent
required editing a file and redeploying — not credible for a real HIE.

ADR 0002 already named **OPAL** as the target for real-time consent propagation
to the OPA PDP. This ADR adopts it for the PoC.

## Decision

Split authorization into **policy** (slow-changing, in git — see ADR 0007) and
**consent data** (fast-changing, revocable), synced independently to OPA by OPAL.

### Components

| Component | Role |
|-----------|------|
| `opal-server` | Tracks the policy-mirror repo (ADR 0007) + declares the consent data source |
| `opal-client` | Runs the embedded **OPA PDP** (port 8181); fetches policy + data |
| `consent-service` | Holds consent state; serves it at `GET /policy-data`; asks OPAL to publish an update on every change |
| `broadcast_channel` (postgres) | OPAL pub/sub backbone for multi-worker fan-out |
| `gateway` | Single entry point; `POST /v1/admin/consent` proxies to consent-service |

### Data contract

- Consent is control-plane data only — subject pseudonym + boolean flags, **no PHI**.
- consent-service serves the complete consent picture keyed by subject; OPAL
  syncs it to OPA at `data.consent`.
- `policy/authz.rego` reads `data.consent[input.subject_id].research`; the
  request input no longer carries consent.

### Flow (revocation)

1. `POST /v1/admin/consent?subject=…&action=revoke` (gateway → consent-service).
2. consent-service updates state and calls `opal-server /data/config` to publish
   a data update on the `policy_data` topic.
3. opal-client re-fetches `/policy-data` and updates OPA's `data.consent`.
4. The next PDP evaluation denies research access — **no policy redeploy, no
   gateway restart**. Proven in `demo.sh` steps 7a/7b.

### Hermetic tests

Consent is injected in Rego unit tests via `with data.consent as {…}`, so
`opa test policy/` in `scripts/verify.sh` stays network-free.

## Consequences

**Positive**

- Consent withdrawal is immediate and demonstrable.
- Policy and consent evolve and audit independently.
- Matches the production OPAL topology, not a bespoke shim.

**Negative / trade-offs**

- More moving parts (OPAL server/client + broadcast postgres) in compose.
- OPAL images are `linux/amd64` (emulated on Apple Silicon).
- Propagation is eventually-consistent (sub-second in practice); `demo.sh` polls
  rather than assuming instant convergence.

## Out of scope (PoC)

OPAL authentication/JWT, signed policy bundles, git webhooks (polling instead),
consent for purposes beyond `research`, and consent provenance/audit trail
beyond the gateway audit sink.
