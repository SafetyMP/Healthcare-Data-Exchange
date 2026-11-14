# Compliance and evidence boundaries — Healthcare Data Exchange

Healthcare Data Exchange is a synthetic guided browser demonstration with a
separate reference backend. Neither path establishes legal compliance, clinical
safety, certification, an authorization to operate (ATO), or permission to process
real health data. The [product mandate](../product-mandate.md) defines the current
scope.

## What an observation supports

| Topic | Browser demonstration | Reference backend evidence needed | What neither establishes |
|---|---|---|---|
| Purpose-specific consent | Local consent changes alter the matching simulated request | Policy tests and a running consent-service/OPAL revoke/grant scenario | A real patient's lawful consent or a complete legal basis |
| Regional restrictions | Requester presets trigger fixture allow/deny rules | Verified-caller, routing and deny tests against the running gateway | Actual geographic residency or international-transfer compliance |
| Limited response | A permitted derivative shows only synthetic `id` and `resourceType` | Gateway filtering and policy tests for the exception | Anonymization, a safe clinical derivative or lawful export |
| Caller identity | A visitor selects a demo requesting-team preset | Authentication and adversarial tests of per-cell demo credentials | Production identity federation, QHIN participation or full UDAP/SSRAA |
| Decision history | Activity shows this tab's simulated actions | Backend audit tests and inspection of the configured sink | A durable, complete or legally compliant clinical audit system |
| Human oversight | A fixed example is marked as pending review | Tests of the separate stub decision and approve/reject endpoints | Clinical model performance, clinical approval or regulatory conformity |
| Key lifecycle | Not part of the nine-step browser guide | Software key-store tests and the scoped backend shred scenario | Production HSM custody or erasure of all database, index, backup and audit copies |

The word **simulated** is material: the public static build does not call OPA,
OPAL, HAPI FHIR or the reference gateway. Its request context in the URL is a UI
selection. Backend authorization must use verified caller credentials; see
[ADR 0000](../adr/0000-threat-model.md).

## Verification is scoped to the execution path

[Browser checks](../../web/package.json) exercise the synthetic application.
[Hermetic backend verification](../../scripts/verify.sh) tests code, policy and
repository contracts. [Cooperative](../../scripts/demo.sh) and
[adversarial](../../scripts/adversarial.sh) scripts require the running reference
stack. None of these results can substitute for another execution path or for
verification of a deployed site. Record the revision, command and result when
claiming a check passed.

The [security policy](../../SECURITY.md), [threat model](../../specs/threat-model.yaml),
and [architecture](overview.md) document implementation boundaries. This page does
not declare those checks passed merely because their scripts exist.

## Historical regulatory design mapping

The [original mapping at revision bae1c21](https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/bae1c21d9b3bbb5faf98d660ea39bf68d44f9e34/docs/architecture/compliance-mapping.md)
preserves the earlier “Cloud Healthcare Exchange” discussion of FedRAMP, GDPR,
EHDS, TEFCA and the EU AI Act. Its architecture targets, legislative timelines,
legal interpretations and proposed organizational controls are historical planning
material. They have not been revalidated here and are not current legal guidance
or delivery commitments.

In particular, a UI label such as `art50_transparency`, a purpose string, a region
name, or a successful policy test does not demonstrate satisfaction of a legal
obligation. Historical terms such as “Arch” and “proves” must be read in the context
of that earlier design record, not as certification of the current application.

The [reference index](../references.md) links the preserved bibliography and
current implementation sources. [ADRs](../adr/) remain available as decision
history; broader production proposals do not become implemented capabilities by
appearing in an ADR.
