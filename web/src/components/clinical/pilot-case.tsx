"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ArrowRightLeft, FileJson2, Inbox, ListChecks, ShieldCheck } from "lucide-react";
import type { CredentialProfile } from "@/lib/api";
import { DEMO_EVENT, getDemoConsent, resetDemo, simulateConsent, simulatePatient, type DemoPurpose } from "@/lib/demo";
import { resetSelectedPatient } from "./patient-selector";
import { resetAccessContext } from "./use-access-context";
import styles from "./pilot-case.module.css";

const patientId = "patient-eu-001";
const fields = ["id", "resourceType", "name", "birthDate", "gender"];
type Intake = { id: string; title: string; purpose: DemoPurpose; requester: CredentialProfile; team: string; requested: string[] };
const queue: Intake[] = [
  { id: "DX-104", title: "US derivative extract", purpose: "derivative", requester: "us-clinician", team: "US clinician team", requested: ["id", "resourceType", "name"] },
  { id: "DX-105", title: "EU research record", purpose: "research", requester: "eu-visiting", team: "EU visiting team", requested: ["id", "resourceType", "birthDate"] },
  { id: "DX-106", title: "US treatment record", purpose: "treatment", requester: "us-home", team: "US home team", requested: [...fields] },
];

function evaluate(request: Intake) {
  const result = simulatePatient(patientId, request.purpose, request.requester);
  const resource = result.ok ? result.data.patient as Record<string, unknown> : {};
  return { resource, fields: Object.keys(resource), status: result.status, reason: result.ok
    ? result.data.exception_label ? "Cross-region derivative exception" : "In-region access"
    : (result.body && typeof result.body === "object" && "reason" in result.body ? String(result.body.reason) : "Denied") };
}
type Receipt = ReturnType<typeof evaluate>;
type Draft = { selected: string[]; receipt?: Receipt; staged?: Record<string, unknown>; before?: Receipt; event?: string; held?: boolean };
function initialDrafts(): Draft[] { return queue.map(item => ({ selected: [...item.requested] })); }
function subscribe(listener: () => void) {
  window.addEventListener(DEMO_EVENT, listener);
  return () => window.removeEventListener(DEMO_EVENT, listener);
}

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

function Reference() {
  return <section className={styles.technical} id="technical" aria-labelledby="tech-title">
    <p className={styles.kicker}>Implementation reference</p><h2 id="tech-title">Where the evidence comes from</h2>
    <details><summary>Browser fixture and the staged packet</summary><p>The browser evaluates a synthetic FHIR Patient using requester, region, purpose and the patient’s current consent. The field checklist filters the result locally. Staging creates a preview in memory. A receiving endpoint has not been contacted.</p>
      <p><a href="https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/main/web/src/lib/demo.ts">Read the browser rules</a> · <a href="https://github.com/SafetyMP/Healthcare-Data-Exchange/tree/main/fhir/samples">Inspect the FHIR fixtures</a></p></details>
    <details id="policy-provenance"><summary>Policy release, consent updates and endpoint checks</summary>
      <PublicationCheck /><p>The Go gateway verifies the caller and asks OPA for a decision. OPAL tracks policy code in the Git mirror and distributes consent data separately. Compare the published bundle hash with the mirror pointer, then collect evidence from each receiving gateway.</p>
      <p>The Compose probe polls one gateway for patient-eu-002 after a research withdrawal and grant. A bundle hash alone cannot tell a privacy officer when a receiver began denying reads. Timing requires comparable event and observation timestamps.</p>
      <p><a href="https://github.com/SafetyMP/healthcare-policy#opal-bundle">Published policy mirror</a> · <a href="https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/main/scripts/demo.sh">Read the gateway probe</a> · <a href="https://www.openpolicyagent.org/docs/management-status">OPA status evidence</a></p></details>
  </section>;
}

export function CasePage() {
  return <div className={styles.casePage}>
    <header className={styles.masthead}><span><ArrowRightLeft aria-hidden="true" /> Healthcare Data Exchange</span>
      <nav aria-label="Desk sections"><a href="#research-request">Request queue</a><a href="#pilot-costs">Pilot costs</a><a href="#technical">Technical reference</a></nav></header>
    <div className={styles.caseBody}>
      <div className={styles.caseHeading}><p className={styles.kicker}>Exchange operations / Synthetic records</p><h1>Disclosure desk</h1>
        <p>Prepare a packet for the requesting team. Check the patient’s permissions and remove fields outside the authorized scope before staging it.</p></div>
      <DisclosureDesk /><PilotWorksheet /><Reference />
    </div></div>;
}

export function GatewayReference() {
  return <div className={styles.caseBody}><div className={styles.caseHeading}><p className={styles.kicker}>Healthcare Data Exchange / Local gateway</p>
    <h1>Gateway reference</h1><p>This build connects synthetic patient workflows to the configured gateway. Bring up the local stack and select a requester profile to exercise a real decision.</p></div>
    <p className={styles.localLinks}><Link href="/patients">Open patient access</Link> · <a href="https://github.com/SafetyMP/Healthcare-Data-Exchange#run-the-reference-backend">Backend setup</a></p><Reference /></div>;
}

function DisclosureDesk() {
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [notice, setNotice] = useState("");
  const item = queue[index], draft = drafts[index];
  const receipt = draft.receipt;
  const consent = useSyncExternalStore<boolean | null>(subscribe, () => getDemoConsent(patientId, item.purpose), () => null);
  const outside = receipt ? draft.selected.filter(field => !receipt.fields.includes(field)) : [];
  const ready = !draft.held && receipt?.status === 200 && draft.selected.length > 0 && outside.length === 0;
  function update(next: Draft, message: string) {
    setDrafts(old => old.map((previous, position) => position === index ? next : previous));
    setNotice(message);
  }
  function check() {
    const result = evaluate(item);
    update({ ...draft, receipt: result, held: false, staged: undefined }, `Policy check complete. ${result.fields.length} authorized fields.`);
  }
  function stage() {
    if (draft.held) return;
    const result = evaluate(item);
    if (result.status !== 200 || !draft.selected.length || draft.selected.some(field => !result.fields.includes(field))) {
      update({ ...draft, receipt: result, staged: undefined }, "Packet blocked by the latest policy check.");
      return;
    }
    const staged = Object.fromEntries(draft.selected.map(field => [field, result.resource[field]]));
    update({ ...draft, receipt: result, staged, held: false }, `Packet staged with ${draft.selected.length} fields. No transfer occurred.`);
  }
  function replay() {
    if (consent === null || !receipt) return;
    const granted = !consent;
    const before = evaluate(item);
    if (!simulateConsent(patientId, item.purpose, granted).ok) return;
    const after = evaluate(item);
    const event = granted ? "Patient grant" : "Patient withdrawal";
    update({ ...draft, receipt: after, before, event, staged: undefined }, `${event} recorded. Rechecked the same request. ${after.fields.length} fields authorized.`);
  }
  function reset() {
    resetSelectedPatient(); resetAccessContext(); resetDemo();
    setIndex(0); setDrafts(initialDrafts()); setNotice("Original requests and consent restored.");
  }
  return <section id="research-request" aria-label="Disclosure workbench" className={styles.desk}>
    <div className={styles.queue}>
      <h2><Inbox aria-hidden="true" /> Intake queue</h2>
      <div className={styles.queueItems}>{queue.map((entry, position) => {
        const state = drafts[position];
        return <button type="button" key={entry.id} aria-pressed={position === index} onClick={() => { setIndex(position); setNotice(""); }}>
          <span>{entry.id}</span><strong>{entry.title}</strong><small>{state.staged ? "Staged" : state.held ? "On hold" : state.receipt ? "Checked" : "Unreviewed"}</small>
        </button>;
      })}</div></div>
    <div className={styles.sheet}>
      <div className={styles.sheetHeading}><p className={styles.kicker}>{item.id} / Disclosure request</p><h2>{item.title}</h2>
        <dl className={styles.context}><div><dt>Patient / home</dt><dd>Anna Mueller · EU</dd></div><div><dt>Requester</dt><dd>{item.team}</dd></div><div><dt>Consent for {item.purpose}</dt><dd>{consent === null ? "Loading" : consent ? "Granted" : "Withheld"}</dd></div></dl></div>
      <div className={styles.panels}><section className={styles.manifest} aria-labelledby="manifest-title">
        <h3 id="manifest-title"><ListChecks aria-hidden="true" /> Field manifest</h3>
        <p>Choose which requested fields to put in the packet.</p>
        <div className={styles.columns}><span>Requested field</span><span>Policy scope</span></div>
        {item.requested.map(field => <label className={styles.field} key={field}>
          <span><input type="checkbox" checked={draft.selected.includes(field)} onChange={event => {
            const selected = event.target.checked ? item.requested.filter(key => key === field || draft.selected.includes(key)) : draft.selected.filter(key => key !== field);
            update({ ...draft, selected, staged: undefined }, "Field selection updated.");
          }} />{field}</span><small data-scope={receipt ? receipt.fields.includes(field) ? "in" : "out" : undefined}>{receipt ? receipt.fields.includes(field) ? "In scope" : "Withhold" : "Unchecked"}</small></label>)}
        <button type="button" className={styles.primary} disabled={consent === null} onClick={check}>{draft.held ? "Recheck and reopen" : "Check policy"}</button>
      </section>
      <section className={styles.packet} aria-labelledby="packet-title"><h3 id="packet-title"><FileJson2 aria-hidden="true" /> Disclosure packet</h3>
        <p>{draft.staged ? "Staged locally. No record was transmitted." : receipt ? `${draft.selected.length} selected · ${outside.length} outside scope` : "Check the manifest to see which fields the requester may receive."}</p>
        {draft.staged ? <pre aria-label="Staged JSON">{JSON.stringify(draft.staged, null, 2)}</pre> : <div className={styles.packetState}><ShieldCheck aria-hidden="true" /><strong>{draft.held ? "Held for review" : !receipt ? "Awaiting policy check" : receipt.status !== 200 ? "Access denied" : outside.length ? "Remove fields marked Withhold" : draft.selected.length ? "Ready to stage" : "Select a field"}</strong></div>}
        <div className={styles.actions}><button type="button" className={styles.primary} disabled={!ready || !!draft.staged} onClick={stage}>Stage packet</button>
        <button type="button" className={styles.secondary} disabled={draft.held} onClick={() => update({ ...draft, staged: undefined, held: true }, "Request placed on hold for steward review.")}>Hold request</button></div></section></div>
      <div className={styles.traceLine}><h3>Decision receipt</h3>
        <p>{receipt ? `${receipt.status} · ${receipt.reason} · Authorized fields: ${receipt.fields.join(", ") || "none"}.` : "No policy check recorded."}</p>
        <p>Source: browser fixture · Receiving gateway: unobserved.</p></div>
      <details className={styles.patientEvent}><summary>Replay a patient consent event</summary>
        <p>Anna can grant or withdraw consent for {item.purpose}. Replay her choice and recheck this request. An existing staged packet must be prepared again.</p>
        <button className={styles.secondary} type="button" disabled={!receipt || consent === null} onClick={replay}>{consent ? "Replay patient withdrawal" : "Replay patient grant"}</button>
        {!receipt && <p>Check policy first to capture a baseline.</p>}
        {draft.event && draft.before && receipt && <p><strong>{draft.event}.</strong> Before: {draft.before.status} · {draft.before.fields.join(", ") || "no fields"}. After: {receipt.status} · {receipt.fields.join(", ") || "no fields"}.</p>}</details>
    </div>
    <div className={styles.deskFooter}><details><summary>Session and reset</summary><p>Drafts last until you leave or reload this page. Consent and activity persist in this tab when session storage is available. Reset also clears guided workflow progress.</p><button type="button" className={styles.secondary} onClick={reset}>Reset tab demo</button></details>
    <span role="status" aria-atomic="true">{notice}</span></div>
  </section>;
}

const assumptions = [
  { key: "requests", label: "Eligible requests per month", initial: "300", min: 1, max: 1000000 },
  { key: "minutes", label: "Minutes saved per request", initial: "5", min: 0, max: 480 },
  { key: "rate", label: "Loaded hourly rate ($)", initial: "60", min: 1, max: 1000 },
  { key: "cost", label: "First-year cost ($)", initial: "14400", min: 0, max: 100000000 },
] as const;

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function PilotWorksheet() {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(assumptions.map(item => [item.key, item.initial])));
  const { requests, minutes, rate, cost } = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value)]));
  const invalid = assumptions.find(({ key, min, max }) => {
    const number = Number(values[key]);
    return values[key].trim() === "" || !Number.isInteger(number) || number < min || number > max;
  });
  const yearlyRequests = requests * 12;
  const capacity = yearlyRequests * minutes / 60 * rate;
  const difference = capacity - cost;
  const scale = Math.max(capacity, cost, 1);
  const breakEven = cost * 60 / (yearlyRequests * rate);
  return (
    <section id="pilot-costs" className={styles.worksheet} aria-labelledby="pilot-heading">
      <div className={styles.business}>
        <span className={styles.kicker}>Exchange operations · funding decision</span>
        <h2 id="pilot-heading">Would faster review pay for a pilot?</h2>
        <p>As exchange operations director, you fund the review desk. Keep the manual process, introduce a checklist, or test a policy check alongside the steward. In a shadow pilot the steward still controls each release.</p>
        <p>Compare matched requests under manual and checklist review. Use the better baseline to estimate extra minutes saved per eligible request, including escalations. Budget for integration, training and support.</p>
      </div>
      <div className={styles.model}>
        <fieldset>
          <legend>Illustrative inputs</legend>
          <div className={styles.numbers}>{assumptions.map(({ key, label, min, max }) =>
            <label key={key}>{label}
              <input type="number" value={values[key]} min={min} max={max} step="1" onChange={event => setValues({ ...values, [key]: event.target.value })} />
            </label>
          )}</div>
        </fieldset>
        <div className={styles.result} aria-live="polite" aria-atomic="true">
          {invalid ? <p>Enter a whole number from {invalid.min.toLocaleString("en-US")} to {invalid.max.toLocaleString("en-US")} for {invalid.label.toLowerCase()}.</p> : <>
            <figure className={styles.chart} aria-label="Year-one cost and staff capacity comparison">
              <figcaption>Year-one comparison</figcaption>
              {[{ label: "Staff capacity", value: capacity }, { label: "Pilot cost", value: cost }].map(({ label, value }) => (
                <div key={label}><span>{label} <b>{currency.format(value)}</b></span><i aria-hidden="true"><em style={{ width: `${value / scale * 100}%` }} /></i></div>
              ))}
            </figure>
            <strong>{currency.format(Math.abs(difference))} {difference < 0 ? "shortfall" : difference > 0 ? "above cost" : "at break-even"}</strong>
            <p>Year-one staff capacity at the assumed rate. Break-even requires {breakEven.toLocaleString("en-US", { maximumFractionDigits: 2 })} minutes saved per eligible request.</p>
          </>}
        </div>
      </div>
      <div className={styles.evidence}>
        <h3>Who decides whether to expand?</h3>
        <p><strong>Data steward.</strong> Compare each shadow recommendation with the desk’s reviewed decision and field list. Replay a revoked consent. Pause if the model would release an unauthorized field. Investigate eligible requests it held and document the reason before signing off.</p>
        <p><strong>Operations director.</strong> With the steward’s sign-off, compare reviewer time and escalations against the better manual or checklist baseline. Fund expansion only if measured capacity covers first-year cost and the team can put that time to use. Report cash savings only when spending falls.</p>
        <details><summary>How exchange teams evaluate this kind of work</summary>
          <p>Maryland’s CRISP exchange describes investigators applying for research use and separate committees reviewing use cases. AHRQ’s exchange evaluation guide asks teams to identify stakeholders, objectives and feasible measures. Those sources informed the roles and pilot criteria in this fictional case. <a href="https://www.crisphealth.org/research/">CRISP research access</a> · <a href="https://digital.ahrq.gov/health-information-exchange-hie-evaluation-toolkit">AHRQ exchange evaluation guide</a></p>
        </details>
        <p>ONC describes recording and maintaining patient choices. HL7’s FHIR R4 Consent model represents recipient, purpose, and policy context. The EU and US decisions above follow this project’s synthetic rules. <a href="https://healthit.gov/privacy-security/patient-consent-electronic-health-information-exchange/">ONC consent guidance</a> · <a href="https://hl7.org/fhir/R4/consent-definitions.html">HL7 Consent definitions</a></p>
      </div>
    </section>
  );
}
