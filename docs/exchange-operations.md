# Exchange operations

The public workbench uses three synthetic requests for Anna Mueller’s EU record. A data steward prepares a packet for a requesting team. The patient controls the recorded consent for each purpose. [Open the disclosure desk](https://safetymp.github.io/Healthcare-Data-Exchange/#research-request)

| Request | Desk action | Observable consequence |
| --- | --- | --- |
| DX-104, US derivative | Check policy, remove the requested name, then stage. Replay the patient’s withdrawal. | The first packet contains only `id` and `resourceType`. Withdrawal clears it and the same request returns a simulated 403. |
| DX-105, EU research | Check with research consent withheld, then replay Anna’s grant. | The request changes from denied to allowed. The staged preview includes only selected fields. |
| DX-106, US treatment | Check policy with treatment consent granted and hold the request. | The fixture denies the cross-region request. The steward can reopen a hold with an explicit recheck. |

The browser uses its existing policy fixture to produce the resource. Packet preparation is a local field filter over that resource. No record is transmitted. The receipt describes a simulated check with no receiving gateway observation. [Browser fixture](https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/main/web/src/lib/demo.ts)

## Evaluate the desk

CRISP describes separate governance review for investigators’ data requests and explains that the data supplied depends on use. Its consumer and privacy governance also informs who should review consent-related operations. AHRQ asks exchange teams to define stakeholders, objectives and feasible value measures. The roles and pilot below apply these ideas to this fictional exchange. [CRISP research access](https://www.crisphealth.org/research/) · [CRISP governance](https://www.crisphealth.org/governance/) · [AHRQ exchange evaluation guide](https://digital.ahrq.gov/health-information-exchange-hie-evaluation-toolkit)

The operations director compares matched requests using the manual desk, a checklist and shadow policy checks. Track incorrect exclusions, any excess field, escalation effort and reviewer minutes. A steward reviews every proposed packet. Pause on an unauthorized field. Fund expansion only when the measured usable capacity covers first-year cost and the steward accepts the field decisions. The worksheet’s assumptions are illustrative. [Pilot costs and capacity](https://safetymp.github.io/Healthcare-Data-Exchange/#pilot-costs)

## Verify a policy release

A release engineer can inspect the pinned publication and compare a candidate SHA-256 with the published bundle and working source. Open **Policy release, consent updates and endpoint checks**, compare the prefilled mirror pointer, then load the working digest and compare again. The snapshot is pinned to the two linked repository revisions. [Publication comparison](https://safetymp.github.io/Healthcare-Data-Exchange/#policy-provenance)

For current checkouts, run these commands from Healthcare-Data-Exchange with the mirror beside it. They check the working stamp and compare the published commit’s rule content against the mirror files and pointer.

```sh
export CHEX_PORTFOLIO_MIRROR_PATH="../healthcare-policy"
./scripts/check-policy-sync.sh
./scripts/check-portfolio-cross-repo.sh
```

Policy rules in Git and consent data follow separate OPAL update paths. A content hash establishes a publication comparison. OPA status can report a specific instance’s activated bundle revision. Verifying a withdrawal also requires a matching patient, requester and purpose at each receiving endpoint, along with comparable event and observation times to measure delay. The project’s separate Compose probe polls one gateway through a research withdrawal and grant. [Policy distribution design](https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/main/docs/adr/0007-opal-policy-mirror.md) · [Consent design](https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/main/docs/adr/0008-opal-consent-sync.md) · [Gateway probe](https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/main/scripts/demo.sh) · [OPA status evidence](https://www.openpolicyagent.org/docs/management-status)
