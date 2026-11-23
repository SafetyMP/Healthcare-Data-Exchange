"use client";

import { useState } from "react";
import type { CredentialProfile } from "@/lib/api";
import { previewPatient, type DemoPurpose } from "@/lib/demo";
import styles from "./pilot-case.module.css";
import guide from "./case-evidence.module.css";

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
    <p>A digest is a fingerprint calculated from the rule files. Compare the July 19, 2026 publication with the mirror (the published copy), then load the working digest to see whether the newer files have the same fingerprint.</p>
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
export type PacketPlan = "requested" | "identifiers" | "hold";
export const requestedFields: Record<DemoPurpose, string[]> = {
  research: ["id", "resourceType", "birthDate"],
  treatment: ["id", "resourceType", "name", "birthDate", "gender"],
  derivative: ["id", "resourceType", "name"],
};
const identifiers = ["id", "resourceType"];
const planLabels: Record<PacketPlan, string> = {
  requested: "Prepare the requested fields",
  identifiers: "Prepare the record identifiers",
  hold: "Hold for steward review",
};
export function packetFields(purpose: DemoPurpose, plan: PacketPlan): string[] {
  if (plan === "hold") return [];
  return plan === "identifiers" ? identifiers : requestedFields[purpose];
}
export function projectPacket(purpose: DemoPurpose, plan: PacketPlan, allowed: string[]): string[] {
  const fields = packetFields(purpose, plan);
  return fields.every(field => allowed.includes(field)) ? fields : [];
}
export function caseLink(purpose: DemoPurpose, granted: boolean, stage: CaseStage, trial: Trial, mirror = false, plan?: PacketPlan) {
  return ["#technical", purpose, granted ? "granted" : "withheld", stage, trial, ...(plan ? ["plan-" + plan] : []), ...(mirror ? ["mirror"] : [])].join("/");
}
export function parseCaseRoute(hash: string) {
  const parts = hash.split("/");
  const [view, request, consent, active, trial] = parts;
  const purpose: DemoPurpose | undefined = request === "treatment" || request === "derivative" || request === "research" ? request : undefined;
  const stage: CaseStage = view === "#policy-provenance" ? "publication" : stages.find(value => value === active) ?? "consent";
  const plan = (["requested", "identifiers", "hold"] as const).find(value => parts.includes("plan-" + value));
  return { mirror: parts.at(-1) === "mirror", snapshot: consent === "granted" || consent === "withheld", technical: view === "#technical" || view === "#policy-provenance", purpose, stage, plan,
    granted: consent === "granted" || (consent !== "withheld" && !!purpose && purpose !== "research"), trial: trial === "opposite" ? "opposite" as const : "selected" as const };
}

const root = "https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/main/";
type Scenario = { label: string; purpose: DemoPurpose; requester: CredentialProfile; scope: string };

function runTrial(scenario: Scenario, granted: boolean) {
  const result = previewPatient("patient-eu-001", scenario.purpose, scenario.requester, granted);
  const resource: Record<string, unknown> = result.ok ? result.data.patient as Record<string, unknown> : {};
  const reason = result.ok ? result.data.exception_label === "cross_bloc_derivative" ? "Derivative exception" : "In-region access" : result.error;
  return { granted, status: result.status, fields: Object.keys(resource), resource, reason };
}
type Receipt = ReturnType<typeof runTrial>;

function packetDescription(purpose: DemoPurpose, receipt: Receipt, plan?: PacketPlan) {
  if (!plan) return "Choose a packet in the case to trace the steward’s decision here.";
  if (plan === "hold") return "The desk initiated no read and staged zero fields. The receiving team has no packet to work from.";
  if (receipt.status !== 200) return "The access check denied the read. The proposed packet contains no releasable fields.";
  const fields = packetFields(purpose, plan);
  const packet = projectPacket(purpose, plan, receipt.fields);
  const outside = fields.filter(field => !receipt.fields.includes(field));
  if (!packet.length) return `The proposed packet includes ${outside.join(", ")} outside the rule’s allowance. It stays at the desk.`;
  return `The local packet can contain ${packet.join(", ")}. Delivery would need a separate observation at the receiver.`;
}

function FieldManifest({ receipt, purpose, plan }: { receipt: Receipt; purpose: DemoPurpose; plan?: PacketPlan }) {
  const requested = requestedFields[purpose];
  const permittedByPlan = packetFields(purpose, plan ?? "requested");
  const [selected, setSelected] = useState(permittedByPlan);
  const [packet, setPacket] = useState<Record<string, unknown> | null>(null);
  const outside = selected.filter(field => !receipt.fields.includes(field));
  const blocked = plan === "hold" || receipt.status !== 200 || !selected.length || outside.length > 0;
  let status = "Stage the checked fields to inspect the local packet, or clear a field to try a smaller packet.";
  if (plan === "hold") status = "The steward held this packet. Return to the case to try a different decision.";
  else if (receipt.status !== 200) status = "Policy denied this trial. No fields can be staged.";
  else if (!selected.length) status = "Select at least one authorized field to stage a preview.";
  else if (outside.length) status = outside.join(", ") + " falls outside the allowed scope.";
  return <div className={styles.manifestBox}><div><h3>Prepare the field manifest</h3>
    <p><code>id</code> identifies this record. <code>resourceType</code> says what kind of record it is, here a Patient.</p>
    {requested.map(field => <label key={field} className={styles.fieldRow}><span><input type="checkbox" disabled={!permittedByPlan.includes(field)} checked={selected.includes(field)} onChange={() => {
      setSelected(selected.includes(field) ? selected.filter(key => key !== field) : requested.filter(key => key === field || selected.includes(key))); setPacket(null);
    }} />{field}</span><span>{plan === "hold" ? "Held" : !receipt.fields.includes(field) ? "Withhold" : permittedByPlan.includes(field) ? "Authorized" : "Outside plan"}</span></label>)}
    <button className={styles.primary} type="button" disabled={blocked || !!packet}
      onClick={() => setPacket(Object.fromEntries(selected.map(field => [field, receipt.resource[field]])))}>Stage field preview</button></div>
    <div><h3>Staged preview</h3><div role="status">{packet ? <><pre aria-label="Staged JSON">{JSON.stringify(packet, null, 2)}</pre><p>Local synthetic packet. No transfer occurred.</p></> : <p>{status}</p>}</div></div></div>;
}

export function CaseEvidence({ scenario, route }: { scenario: Scenario; route: ReturnType<typeof parseCaseRoute> }) {
  const baseline = runTrial(scenario, route.granted);
  const alternate = runTrial(scenario, !route.granted);
  const active = route.trial === "selected" ? baseline : alternate;
  const held = route.plan === "hold";
  const trialLabel = held ? "Hypothetical browser" : "Browser";
  const href = (stage: CaseStage, trial = route.trial) => caseLink(scenario.purpose, route.granted, stage, trial, route.mirror, route.plan);
  const back = ["#research-request", scenario.purpose, route.granted ? "granted" : "withheld", ...(route.plan ? ["plan-" + route.plan] : []), ...(route.mirror ? ["mirror"] : [])].join("/");
  return <article className={styles.technicalGuide + " " + guide.guide} aria-label="Technical evidence for the selected request">
    <a href={back}>← Return to the selected privacy case</a>
    <header className={styles.caseHeading}><p className={styles.kicker}>Technical evidence / Anna Mueller · patient-eu-001</p><h1 tabIndex={-1} id="technical-title">Trace the {scenario.purpose} request</h1><p>Follow one question at a time. Who may read Anna’s record? Which fields fit the request? What evidence would show that a receiving system applied the rule? Both consent trials run here in your browser.</p></header>
    <dl className={styles.techFacts}><div><dt>Request</dt><dd>{scenario.label}</dd></div><div><dt>Credential profile</dt><dd>{scenario.requester}</dd></div><div><dt>Steward’s decision</dt><dd>{route.plan ? planLabels[route.plan] : "No packet selected"}</dd></div></dl>
    <nav className={styles.stageNav} aria-label="Implementation stages">{stages.map((stage, index) => <a key={stage} href={href(stage)} aria-current={stage === route.stage ? "step" : undefined}><span>{index + 1}</span>{stageNames[stage]}</a>)}</nav>
    <section className={styles.trialPanel} aria-label="Consent trials"><h2>{held ? "If the desk had requested a read" : "Consent at the time of the read"}</h2>
      <p>{held ? "The steward paused the request before checking access. Choose a trial to see what the browser rule would have allowed if the team had asked to read the record." : "Compare the two trials. They keep the team and purpose fixed and change only Anna’s consent. Selecting a trial leaves her recorded preference in this tab intact."}</p>
      <div className={styles.trialGrid}>{(["selected", "opposite"] as const).map((trial, index) => {
        const receipt = index === 0 ? baseline : alternate;
        return <a key={trial} href={href(route.stage, trial)} aria-current={route.trial === trial ? "true" : undefined}>
          <strong>{index === 0 ? "Selected consent" : "Opposite consent"} · {receipt.granted ? "Granted" : "Withheld"}</strong>
          <span>{trialLabel} {receipt.status} · {receipt.status === 200 ? "Read allowed" : "Read denied"} · {receipt.fields.length} {held ? "fields under that rule" : "authorized fields"}</span></a>;
      })}</div></section>
    <section className={styles.stagePanel} aria-label={stageNames[route.stage]}>
      {held && <p className={styles.kicker}>Held request · Hypothetical policy evaluation</p>}
      {route.stage === "consent" && <><h2>Which access rule applies?</h2><p>In the connected system, a gateway checks the team’s credentials to establish who is asking and from which region. Its rule evaluator, Open Policy Agent (OPA), checks the reason for the request, the region and Anna’s consent for that use. OPAL delivers consent changes to the evaluator separately from rule updates.</p>
        <p className={guide.observation}><strong>{trialLabel} {active.status}.</strong> {held ? "This trial models a read by" : "Requester"} {scenario.requester} for {scenario.purpose} with consent {active.granted ? "granted" : "withheld"}. {active.reason}</p>
        <a href={root + "services/gateway/internal/requester/requester.go"}>Caller context</a> · <a href={root + "policy/authz.rego"}>OPA rule</a> · <a href={root + "web/src/lib/demo.ts"}>Browser fixture</a></>}
      {route.stage === "fields" && <><h2>Which fields fit this packet?</h2><p>FHIR is a standard for organizing and exchanging health records. After an allowed check, the connected gateway retrieves a Patient record from its home region and returns the fields allowed by policy. The field manifest lists the pieces the steward proposes to share.</p>
        <p className={guide.observation}><strong>{held ? "Held at the desk · 0 fields staged" : `${requestedFields[scenario.purpose].length} requested · ${active.fields.length} authorized`}</strong><br/>{packetDescription(scenario.purpose, active, route.plan)}</p>
        <FieldManifest key={String(active.granted) + "/" + (route.plan ?? "")} receipt={active} purpose={scenario.purpose} plan={route.plan}/>
        <a href={root+"services/gateway/internal/handlers/handlers.go"}>Gateway read</a> · <a href={root+"services/gateway/internal/fhir/client.go"}>Field filter</a> · <a href={root+"fhir/samples/eu/patient-eu-001.json"}>Patient fixture</a></>}
      {route.stage === "receiver" && <><h2>What can the steward sign?</h2><p className={guide.observation}><strong>{held ? "Desk decision · hold." : `Browser ${active.status}.`}</strong> {packetDescription(scenario.purpose, active, route.plan)}</p>
        <p>No authenticated read, receiver timestamp or delivery acknowledgment exists for Anna’s case. A browser receipt shows how the simulation responded. To confirm enforcement, compare the time Anna changed consent with the time each receiving system checked the same request, and inspect the fields it returned.</p>
        <p>The linked test runs the connected services and checks one gateway after a research withdrawal and grant for a different synthetic record, patient-eu-002. <a href={root+"scripts/demo.sh"}>Gateway probe</a> · <a href={root+"docs/adr/0008-opal-consent-sync.md"}>Consent distribution</a></p></>}
      {route.stage === "publication" && <><h2>Which rule bundle was published?</h2><p>Publication answers which rules were made available. A receiving gateway must be checked separately to establish which rules and consent data it used.</p><PublicationCheck/><a href={root + "scripts/sync-policy-repo.sh"}>Policy sync script</a> · <a href="https://github.com/SafetyMP/healthcare-policy#opal-bundle">Published policy mirror</a> · <a href="https://www.openpolicyagent.org/docs/management-status">OPA instance status</a></>}
    </section><footer className={styles.techFooter}><a href={back}>Return to {scenario.label.toLowerCase()}</a><a href={href(route.stage)}>Permalink to this stage and trial</a>{route.mirror && <a href="https://github.com/SafetyMP/healthcare-policy#follow-a-research-access-request">Return to the policy mirror case</a>}</footer>
  </article>;
}
