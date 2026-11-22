# Research consent and exchange operations

A study coordinator asks an exchange data steward to use Anna Mueller’s synthetic EU record. The case begins with the patient’s withheld research consent. Predict the outcome, check the access request and replay Anna’s grant or withdrawal. The steward can also select a US treatment request or US secondary use. The operations director decides whether a separately funded shadow pilot is justified. [Open the privacy desk](https://safetymp.github.io/Healthcare-Data-Exchange/#research-request)

| Selected request | With consent withheld | With consent granted |
| --- | --- | --- |
| Research, EU visiting team | Browser 403, no fields | Browser 200, five patient fields |
| Treatment, US home team | Browser 403, no fields | Browser 403, regional restriction |
| Derivative use, US clinician team | Browser 403, no fields | Browser 200, only `id` and `resourceType` |

## Inspect the same request

Choose **Inspect this request’s field evidence**. The link carries the same patient, purpose, credential profile and selected consent. Compare the opposite consent trial, then select a stage. For a granted derivative request, trim the requested name and stage only the two authorized fields. Switching to the withheld trial clears the synthetic preview. Trial comparisons leave the patient’s recorded choice intact. Each stage links to sources and has a permalink. Use the return link to resume that case. [Derivative field trial](https://safetymp.github.io/Healthcare-Data-Exchange/#technical/derivative/granted/fields/selected) · [Browser fixture](https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/main/web/src/lib/demo.ts)

## Evaluate the desk

CRISP describes separate governance review for investigators’ data requests and explains that the data supplied depends on use. Its consumer and privacy governance also informs who should review consent-related operations. AHRQ asks exchange teams to define stakeholders, objectives and feasible value measures. The roles and pilot below apply these ideas to this fictional exchange. [CRISP research access](https://www.crisphealth.org/research/) · [CRISP governance](https://www.crisphealth.org/governance/) · [AHRQ exchange evaluation guide](https://digital.ahrq.gov/health-information-exchange-hie-evaluation-toolkit)

The operations director compares matched requests using the manual desk, a checklist and shadow policy checks. Track incorrect exclusions, any excess field, escalation effort and reviewer minutes. A steward reviews every proposed packet. Pause on an unauthorized field. Fund expansion only when the measured usable capacity covers first-year cost and the steward accepts the field decisions. The worksheet’s assumptions are illustrative. [Pilot costs and capacity](https://safetymp.github.io/Healthcare-Data-Exchange/#pilot-costs)

## Verify a policy release

A release engineer can inspect the pinned publication and compare a candidate SHA-256 with the published bundle and working source. Open **Published policy**, compare the prefilled mirror pointer, then load the working digest and compare again. The snapshot is pinned to the two linked repository revisions. [Publication comparison](https://safetymp.github.io/Healthcare-Data-Exchange/#policy-provenance)

For current checkouts, run these commands from Healthcare-Data-Exchange with the mirror beside it. They check the working stamp and compare the published commit’s rule content against the mirror files and pointer.

```sh
export CHEX_PORTFOLIO_MIRROR_PATH="../healthcare-policy"
./scripts/check-policy-sync.sh
./scripts/check-portfolio-cross-repo.sh
```

Policy rules in Git and consent data follow separate OPAL update paths. A content hash establishes a publication comparison. OPA status can report a specific instance’s activated bundle revision. Verifying a withdrawal also requires a matching patient, requester and purpose at each receiving endpoint, along with comparable event and observation times to measure delay. The project’s separate Compose probe polls one gateway through a research withdrawal and grant. [Policy distribution design](https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/main/docs/adr/0007-opal-policy-mirror.md) · [Consent design](https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/main/docs/adr/0008-opal-consent-sync.md) · [Gateway probe](https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/main/scripts/demo.sh) · [OPA status evidence](https://www.openpolicyagent.org/docs/management-status)
