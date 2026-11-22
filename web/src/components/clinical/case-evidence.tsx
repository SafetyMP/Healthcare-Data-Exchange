"use client";

import { useState } from "react";
import type { CredentialProfile } from "@/lib/api";
import { previewPatient, type DemoPurpose } from "@/lib/demo";
import styles from "./pilot-case.module.css";

const publication = {
  published: "69ef166ed5ccb51a19df0518a41695b1ed077ee23ca7a141a0104d1108766309",
  working: "94be0d042e91e06c2c02e392851babf74bdf0b3522fae007ccd9b8c3f71fc241",
  mirror: "69ef166ed5ccb51a19df0518a41695b1ed077ee23ca7a141a0104d1108766309",
  stampUrl: "https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/424079f5d4b6769df0ac33a1e909053b8dc216ac/.harness/policy-sync-stamp",
  pointerUrl: "https://github.com/SafetyMP/healthcare-policy/blob/b544d2f377e491eb0d43d2fcdb4078743e9fc94c/.harness/canonical-pointer",
};

function PublicationCheck() {
  const [candidate, setCandidate] = useState(publication.mirror);
  const [result, setResult] = useState("");
  function compare() {
    const digest = candidate.trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(digest)) setResult("Enter the full 64-character hexadecimal digest.");
    else if (digest === publication.published) setResult("Matches the published bundle digest. Verify the mirror files and collect observations from each receiving gateway.");
    else if (digest === publication.working) setResult("Matches the canonical working tree only. Hold publication sign-off and check which bundle was synchronized.");
    else setResult("Digest differs from the pinned publication. Hold sign-off and reconcile the source revision and mirror files.");
  }
  return <div className={styles.publication}>
    <p>The two linked Git snapshots record the same July 19, 2026 publication. Compare its published digest with the mirror pointer or the newer working rules.</p>
    <p><a href={publication.stampUrl}>Pinned canonical stamp</a> · <a href={publication.pointerUrl}>Pinned mirror pointer</a></p>
    <p><strong>Published SHA-256</strong> <code>{publication.published}</code></p>
    <label>Candidate bundle digest<input spellCheck={false} value={candidate} onChange={event => { setCandidate(event.target.value); setResult(""); }} /></label>
    <div className={styles.actions}><button className={styles.primary} type="button" onClick={compare}>Compare digest</button>
      <button className={styles.secondary} type="button" onClick={() => { setCandidate(publication.working); setResult(""); }}>Load working digest</button>
      <button className={styles.secondary} type="button" onClick={() => { setCandidate(publication.mirror); setResult(""); }}>Load mirror pointer</button></div>
    <p role="status" aria-atomic="true">{result}</p>
  </div>;
}

const stages = ["consent", "fields", "receiver", "publication"] as const;
const stageNames = { consent: "Consent and requester", fields: "Field manifest", receiver: "Receiving gateway", publication: "Published policy" };
export type CaseStage = typeof stages[number];
type Trial = "selected" | "opposite";
export function caseLink(purpose: DemoPurpose, granted: boolean, stage: CaseStage, trial: Trial, mirror = false) {
  return ["#technical", purpose, granted ? "granted" : "withheld", stage, trial, ...(mirror ? ["mirror"] : [])].join("/");
}
export function parseCaseRoute(hash: string) {
  const [view, request, consent, active, trial] = hash.split("/");
  const purpose: DemoPurpose | undefined = request === "treatment" || request === "derivative" || request === "research" ? request : undefined;
  const stage: CaseStage = view === "#policy-provenance" ? "publication" : stages.find(value => value === active) ?? "consent";
  return { mirror: hash.split("/").at(-1) === "mirror", snapshot: consent === "granted" || consent === "withheld", technical: view === "#technical" || view === "#policy-provenance", purpose, stage,
    granted: consent === "granted" || (consent !== "withheld" && !!purpose && purpose !== "research"), trial: trial === "opposite" ? "opposite" as const : "selected" as const };
}

const requestedFields = { research: ["id", "resourceType", "name", "birthDate", "gender"], treatment: ["id", "resourceType", "name", "birthDate", "gender"], derivative: ["id", "resourceType", "name"] };
const root = "https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/main/";
type Scenario = { label: string; purpose: DemoPurpose; requester: CredentialProfile; scope: string };

function runTrial(scenario: Scenario, granted: boolean) {
  const result = previewPatient("patient-eu-001", scenario.purpose, scenario.requester, granted);
  const resource: Record<string, unknown> = result.ok ? result.data.patient as Record<string, unknown> : {};
  const reason = result.ok ? result.data.exception_label === "cross_bloc_derivative" ? "Derivative exception" : "In-region access" : result.error;
  return { granted, status: result.status, fields: Object.keys(resource), resource, reason };
}
type Receipt = ReturnType<typeof runTrial>;

function FieldManifest({ receipt, purpose }: { receipt: Receipt; purpose: DemoPurpose }) {
  const requested = requestedFields[purpose];
  const [selected, setSelected] = useState(requested);
  const [packet, setPacket] = useState<Record<string, unknown> | null>(null);
  const outside = selected.filter(field => !receipt.fields.includes(field));
  return <div className={styles.manifestBox}><div><h3>Prepare the field manifest</h3>
    <p>Build a local preview from this trial’s authorized response. Remove every selected field marked Withhold.</p>
    {requested.map(field => <label key={field} className={styles.fieldRow}><span><input type="checkbox" checked={selected.includes(field)} onChange={() => {
      setSelected(selected.includes(field) ? selected.filter(key => key !== field) : requested.filter(key => key === field || selected.includes(key))); setPacket(null);
    }} />{field}</span><span>{receipt.fields.includes(field) ? "Authorized" : "Withhold"}</span></label>)}
    <button className={styles.primary} type="button" disabled={receipt.status !== 200 || !selected.length || !!outside.length || !!packet}
      onClick={() => setPacket(Object.fromEntries(selected.map(field => [field, receipt.resource[field]])))}>Stage field preview</button></div>
    <div><h3>Staged preview</h3><div role="status">{packet ? <><pre aria-label="Staged JSON">{JSON.stringify(packet, null, 2)}</pre><p>Local synthetic packet. No transfer occurred.</p></> : <p>{receipt.status !== 200 ? "Policy denied this trial. No fields can be staged." : !selected.length ? "Select at least one authorized field to stage a preview." : outside.length ? outside.join(", ") + " falls outside the allowed scope." : "Ready to stage the selected fields."}</p>}</div></div></div>;
}

export function CaseEvidence({ scenario, route }: { scenario: Scenario; route: ReturnType<typeof parseCaseRoute> }) {
  const baseline = runTrial(scenario, route.granted);
  const alternate = runTrial(scenario, !route.granted);
  const active = route.trial === "selected" ? baseline : alternate;
  const href = (stage: CaseStage, trial = route.trial) => caseLink(scenario.purpose, route.granted, stage, trial, route.mirror);
  const back = ["#research-request", scenario.purpose, route.granted ? "granted" : "withheld", ...(route.mirror ? ["mirror"] : [])].join("/");
  return <article className={styles.technicalGuide} aria-label="Technical evidence for the selected request">
    <a href={back}>← Return to the selected privacy case</a>
    <header className={styles.caseHeading}><p className={styles.kicker}>Technical evidence / Anna Mueller · patient-eu-001</p><h1 tabIndex={-1} id="technical-title">Trace the {scenario.purpose} request</h1><p>Follow the same EU record and requester through the access check. Compare the selected consent with a counterfactual patient event, then inspect what a receiver would still have to prove.</p></header>
    <dl className={styles.techFacts}><div><dt>Request</dt><dd>{scenario.label}</dd></div><div><dt>Credential profile</dt><dd>{scenario.requester}</dd></div><div><dt>Policy scope</dt><dd>{scenario.scope}</dd></div></dl>
    <nav className={styles.stageNav} aria-label="Implementation stages">{stages.map((stage, index) => <a key={stage} href={href(stage)} aria-current={stage === route.stage ? "step" : undefined}><span>{index + 1}</span>{stageNames[stage]}</a>)}</nav>
    <section className={styles.trialPanel} aria-label="Consent trials"><h2>Compare trial receipts</h2>
      <p>Both trials evaluate the same browser fixture. Only the consent input changes. Trial selection leaves the patient’s recorded preference in this tab intact.</p>
      <div className={styles.trialGrid}>{(["selected", "opposite"] as const).map((trial, index) => {
        const receipt = index === 0 ? baseline : alternate;
        return <a key={trial} href={href(route.stage, trial)} aria-current={route.trial === trial ? "true" : undefined}>
          <strong>{index === 0 ? "Selected consent" : "Opposite consent"} · {receipt.granted ? "Granted" : "Withheld"}</strong>
          <span>Browser {receipt.status} · {receipt.fields.length} authorized fields</span><small>{receipt.fields.join(", ") || "No fields returned"}</small></a>;
      })}</div></section>
    <section className={styles.stagePanel} aria-label={stageNames[route.stage]}><p className={styles.kicker}>{stageNames[route.stage]} / {active.granted ? "Granted trial" : "Withheld trial"}</p>
      {route.stage === "consent" && <><h2>Evaluate the requester and purpose</h2><p>For Anna’s EU record, the {scenario.requester} credential requests {scenario.purpose} access. The patient’s {active.granted ? "grant" : "withheld consent"} and the region rule yield browser status {active.status}.</p><p>{active.reason}</p><a href={root + "web/src/lib/demo.ts"}>Browser fixture implementation</a> · <a href={root + "policy/authz.rego"}>Canonical Rego rules</a></>}
      {route.stage === "fields" && <><FieldManifest key={String(active.granted)} receipt={active} purpose={scenario.purpose}/><a href={root+"fhir/samples/eu/patient-eu-001.json"}>Synthetic patient source</a></>}
      {route.stage === "receiver" && <><h2>What can the steward sign?</h2><p>The selected {scenario.purpose} trial returned {active.status} and {active.fields.length} fields in this browser. No authenticated read, receiver timestamp or delivery acknowledgment exists for Anna’s case.</p><p>For a pilot, pair the recorded patient event with reads at each intended gateway using the same patient, purpose and credential. Compare status and returned fields. Measuring delay requires comparable clocks.</p><p>The separate Compose probe uses patient-eu-002 and polls one receiving gateway through a research withdrawal and grant.</p><a href={root+"scripts/demo.sh"}>Inspect the gateway probe</a> · <a href={root+"docs/adr/0008-opal-consent-sync.md"}>Consent distribution design</a></>}
      {route.stage === "publication" && <><h2>Which rule bundle was published?</h2><PublicationCheck/><p>The mirror’s pinned Git digest identifies the published rules. Consent data travels through OPAL separately. A matching digest alone cannot establish this trial’s result at a receiver.</p><a href="https://github.com/SafetyMP/healthcare-policy#opal-bundle">Published policy mirror</a> · <a href="https://www.openpolicyagent.org/docs/management-status">OPA instance status</a></>}
    </section><footer className={styles.techFooter}><a href={back}>Return to {scenario.label.toLowerCase()}</a><a href={href(route.stage)}>Permalink to this stage and trial</a>{route.mirror && <a href="https://github.com/SafetyMP/healthcare-policy#follow-a-research-access-request">Return to the policy mirror case</a>}</footer>
  </article>;
}
