---
name: jurisdiction-consent
description: "Change EU/US jurisdiction routing, OPAL consent, or OPA policy in Healthcare-Data-Exchange. Use when editing the gateway PEP, consent-service, or policy/*.rego. Never load real PHI or set jurisdiction from query parameters."
---

# Jurisdiction and consent

Federated HIE sketch: EU/US cells, OPAL consent, OPA, FHIR R4.

## Do

- Authorize patient-read from verified per-cell credentials.
- Read consent from `data.consent` published by OPAL.
- After `policy/*.rego` edits, run `./scripts/sync-policy-repo.sh`.

## Do not

- Load production patient data.
- Honor `requester_jurisdiction` as identity.
- Claim FedRAMP/GDPR certification or an ATO.

Verify: `./scripts/verify.sh`. Runtime: `./scripts/demo.sh` and `./scripts/adversarial.sh`.

