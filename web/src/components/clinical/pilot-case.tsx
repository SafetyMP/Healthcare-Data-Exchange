"use client";

import Link from "next/link";
import { CaseEvidence, caseLink, parseCaseRoute, requestedFields, projectPacket, type PacketPlan, type CaseStage } from "./case-evidence";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CredentialProfile } from "@/lib/api";
import { DEMO_EVENT, DEMO_PATIENTS, getDemoConsent, previewPatient, resetDemo, simulateConsent, simulatePatient, type DemoPurpose } from "@/lib/demo";
import { resetSelectedPatient } from "./patient-selector";
import { requesterPresets, resetAccessContext } from "./use-access-context";
import { ArrowRightLeft, ClipboardList, FileText, Users } from "lucide-react";
import styles from "./pilot-case.module.css";

const comparisons = [
  { label: "Research request", id: "DX-105", purpose: "research", requester: "eu-visiting", scope: "EU visiting team", receiver: "Coordinator’s handoff", detail: "The study coordinator asks for the record ID and resource type to match a roster row, plus birth date to check the study’s age criterion." },
  { label: "US treatment", id: "DX-106", purpose: "treatment", requester: "us-home", scope: "US home team", receiver: "US home team’s handoff", detail: "A US care team asks for five demographic fields to reconcile its intake record with the European chart." },
  { label: "US secondary use", id: "DX-104", purpose: "derivative", requester: "us-clinician", scope: "US clinician team", receiver: "US clinician’s handoff", detail: "A US clinician asks for the ID, resource type and name to reconcile a secondary-use extract against a named list." },
] satisfies { label: string; id: string; purpose: DemoPurpose; requester: CredentialProfile; scope: string; receiver: string; detail: string }[];

const purposeLabels: Record<DemoPurpose, string> = {
  research: "Research",
  treatment: "Treatment",
  derivative: "Derivative use",
};

const introductions = {
  research: {
    title: "One open row on the study roster", team: "Visiting study coordinator",
    need: "Anna Mueller’s row on a study roster has a record ID. The coordinator needs her birth date to check an age requirement before the next screening review. Anna’s record is held in Europe.",
    cost: "Without the date, the row stays open and both teams have to revisit it. Copying every field could disclose details the coordinator never asked for.",
    task: "Reviews the age requirement. The study team decides whether Anna is eligible.",
  },
  treatment: {
    title: "Two teams checking one intake record", team: "US home care team",
    need: "A US care team is checking whether its intake record matches Anna Mueller’s European patient record. It asks for basic details such as her name and birth date before relying on the match.",
    cost: "If the desk cannot prepare the information, the care team must find another way to confirm the match. A mistaken match could attach the information to the wrong chart.",
    task: "Checks whether the two records belong to the same person.",
  },
  derivative: {
    title: "A name missing from a second list", team: "US clinician team",
    need: "A US clinician wants to reuse information collected during care to check a separate list. This is called secondary use. The clinician asks for an extract, a copy containing just Anna Mueller’s record ID, its type and her name.",
    cost: "The name would help the clinician check a match. Including it also reveals who the record describes. The steward needs to review the request before preparing the extract.",
    task: "Tries to match an extract to a named list for a secondary use.",
  },
};

function subscribeRoute(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

export function CasePage() {
  const hash = useSyncExternalStore(subscribeRoute, () => window.location.hash, () => "");
  const route = parseCaseRoute(hash);
  const [lastSelection, setLastSelection] = useState(0);
  const index = route.purpose ? comparisons.findIndex(item => item.purpose === route.purpose) : lastSelection;
  const scenario = comparisons[index];
  const intro = introductions[scenario.purpose];
  const consent = useSyncExternalStore<boolean | null>(subscribeToConsent,
    () => getDemoConsent("patient-eu-001", scenario.purpose), () => null);
  const previousMode = useRef(false);
  const previousSection = useRef("");
  useEffect(() => {
    const section = hash.split("/")[0];
    if (section === "#pilot-costs" || (section === "#research-request" && previousSection.current === "#pilot-costs")) {
      const target = document.getElementById(section.slice(1));
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "start" });
    }
    previousSection.current = section;
  }, [hash]);
  useEffect(() => {
    if (previousMode.current !== route.technical) {
      previousMode.current = route.technical;
      const target = document.getElementById(route.technical ? "technical-title" : "research-request");
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "start" });
    }
  }, [route.technical]);
  const plan = route.snapshot && consent !== route.granted ? undefined : route.plan;
  function caseHash(section: string, purpose: DemoPurpose, granted?: boolean, decision?: PacketPlan) {
    return ["#" + section, purpose, ...(decision && granted !== undefined ? [granted ? "granted" : "withheld", "plan-" + decision] : []), ...(route.mirror ? ["mirror"] : [])].join("/");
  }
  function changeCase(index: number, granted?: boolean, decision?: PacketPlan) {
    setLastSelection(index);
    window.history.replaceState(null, "", caseHash("research-request", comparisons[index].purpose, granted, decision));
    window.dispatchEvent(new Event("hashchange"));
  }
  const toEvidence = (stage: CaseStage) => caseLink(scenario.purpose, consent ?? scenario.purpose !== "research", stage, "selected", route.mirror, plan);
  return <div className={styles.casePage}>
    <header className={styles.masthead}><span><ArrowRightLeft aria-hidden="true" /> Healthcare Data Exchange</span>
      <nav aria-label="Case sections"><a href={caseHash("research-request", scenario.purpose, route.technical ? route.granted : consent ?? undefined, route.technical ? route.plan : plan)}>Privacy desk</a>
        {!route.technical && <a href={caseHash("pilot-costs", scenario.purpose, consent ?? undefined, plan)}>Pilot costs</a>}
        <a href={route.technical ? caseLink(scenario.purpose, route.granted, route.stage, route.trial, route.mirror, route.plan) : toEvidence("consent")}>Technical evidence</a></nav></header>
    <div className={styles.caseBody}>
      <div hidden={route.technical}>
        <header className={styles.opening}>
          <div><p className={styles.kicker}>{purposeLabels[scenario.purpose]} · Synthetic case</p>
            <h1>{intro.title}</h1>
            <p>A health information exchange lets one organization request information held by another. Here you’re the data steward, the person who reviews what the receiving team needs and what can be shared.</p>
            <p>{intro.need} {intro.cost}</p>
          </div>
          <figure className={styles.handoffMap}><figcaption>How the request changes hands</figcaption><ol>
            <li><FileText aria-hidden="true"/><div><strong>European record holder</strong><span>Keeps Anna’s record. Its gateway is the service that checks incoming requests.</span></div></li>
            <li><ClipboardList aria-hidden="true"/><div><strong>Exchange data steward</strong><span>Checks the team, purpose and patient choice before preparing a field list.</span></div></li>
            <li><Users aria-hidden="true"/><div><strong>{intro.team}</strong><span>{intro.task}</span></div></li>
          </ol></figure>
        </header>
        {route.snapshot && consent !== null && consent !== route.granted && !route.technical && <aside className={styles.referenceCard}>
          <strong>Shared trial and this tab</strong><p>The shared request used {route.granted ? "granted" : "withheld"} consent. Anna’s current {scenario.purpose} preference in this tab is {consent ? "granted" : "withheld"}. You can replay her synthetic event to reproduce the shared input.</p>
          <button className={styles.secondary} type="button" onClick={() => simulateConsent("patient-eu-001", scenario.purpose, route.granted)}>Replay Anna’s shared {route.granted ? "grant" : "withdrawal"}</button>
        </aside>}
        <ResearchRequest key={scenario.purpose} selection={index} consent={consent} plan={plan} onChange={changeCase} evidenceHref={toEvidence("fields")} />
        <section className={styles.framework} aria-labelledby="framework-heading">
          <p className={styles.kicker}>The exchange framework</p><h2 id="framework-heading">What supports the steward’s decision?</h2>
          <ol><li><strong>Identify the requester</strong><p>The connected gateway verifies the team’s credentials. The desk needs to know who is asking before it can assess the purpose.</p></li>
            <li><strong>Check consent and region</strong><p>The policy engine evaluates the stated purpose, the patient’s choice and the regional access rule for this record.</p></li>
            <li><strong>Limit the packet</strong><p>The gateway filters the record to permitted fields. The steward can narrow that list further or pause the handoff when the team’s need is unclear.</p></li></ol>
          <a href={toEvidence("consent")}>Inspect the selected check</a>
        </section>
        <PilotWorksheet scenario={scenario.label} />
      </div>
      {route.technical && <CaseEvidence key={scenario.purpose} scenario={scenario} route={route} />}
    </div></div>;
}

export function GatewayReference() {
  return <div className={styles.caseBody}><div className={styles.caseHeading}><p className={styles.kicker}>Healthcare Data Exchange / Local gateway</p>
    <h1>Gateway reference</h1><p>The local gateway verifies a requester’s credential, asks OPA for a decision and projects the returned patient fields. OPAL distributes policy and consent updates separately.</p></div>
    <p className={styles.localLinks}><Link href="/patients">Open patient access</Link> · <a href="https://github.com/SafetyMP/Healthcare-Data-Exchange#run-the-reference-backend">Backend setup</a> · <a href="https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/main/scripts/demo.sh">Receiving-gateway probe</a></p></div>;
}

function subscribeToConsent(listener: () => void) {
  window.addEventListener(DEMO_EVENT, listener);
  return () => window.removeEventListener(DEMO_EVENT, listener);
}

const plans: { key: PacketPlan; label: string }[] = [
  { key: "requested", label: "Prepare requested fields" },
  { key: "identifiers", label: "Prepare identifiers only" },
  { key: "hold", label: "Hold for steward review" },
];
const fieldLabels: Record<string, string> = { id: "Record ID", resourceType: "Resource type", birthDate: "Birth date", gender: "Gender", name: "Name" };
type Handoff = { fields: string[]; finding: string; explanation: string };

function handoffFor(scenario: typeof comparisons[number], consent: boolean, plan: PacketPlan): Handoff {
  if (plan === "hold") return { fields: [], finding: "Steward paused the request", explanation: "The steward has paused this packet. The requesting team waits for clarification. No access check is needed for a hold." };
  const check = previewPatient("patient-eu-001", scenario.purpose, scenario.requester, consent);
  if (!check.ok) return { fields: [], finding: !consent ? "Consent check stopped the read" : "Region check stopped the read", explanation: !consent
    ? "Anna has withheld consent for this purpose. The team’s request stays pending. Only a new patient choice can change that consent input."
    : "The team and record are in different regions. Even with consent, this treatment request cannot supply the intake record through this route." };
  const allowed = Object.keys(check.data.patient as Record<string, unknown>);
  const fields = projectPacket(scenario.purpose, plan, allowed);
  let explanation: string;
  if (!fields.length) explanation = "The request includes a name outside the permitted field list. The whole proposed packet stays at the desk. The clinician can ask for a narrower extract.";
  else if (fields.includes("birthDate")) explanation = "The coordinator could match the roster row and review the birth date against the study criterion. The study team still determines eligibility.";
  else explanation = scenario.purpose === "research"
    ? "The coordinator could match the record ID, but the age check stays open. The roster still needs a permitted birth date."
    : "The clinician could reconcile a record ID. Without a name, confirming a match against the named list needs another route.";
  return { fields, finding: fields.length ? "Packet ready to preview" : "Proposed packet exceeds the field allowance", explanation };
}

function EvidenceWalkthrough({ purpose, consent, onFinish }: {
  purpose: DemoPurpose; consent: boolean | null; onFinish: () => void;
}) {
  const [step, setStep] = useState(0);
  const teamRegion = purpose === "research" ? "Europe" : "the US";
  const use = { research: "screening a study roster", treatment: "caring for Anna", derivative: "reusing a limited extract for a separate task" }[purpose];
  const need = { research: "Which field would let the coordinator check the age requirement?", treatment: "Which details could the team compare with its local intake record?", derivative: "Which detail would help the clinician check a name on the other list?" }[purpose];
  const clues = [
    { title: "Where is the request coming from?", text: `Anna’s record is held in Europe. The requesting team is in ${teamRegion}. The exchange checks that route as well as the reason for asking.` },
    { title: "What has Anna agreed to?", text: `This team is asking for information to use in ${use}. Consent is Anna’s permission to use her record for that reason. ${consent === null ? "Her choice is loading." : consent ? "Granted means she agreed to this use." : "Withheld means she has not given permission for this use."} She can make a different choice for another purpose.` },
    { title: "What does the team actually need?", text: `A field is one piece of a record. The record ID points to Anna’s entry. The resource type says what kind of entry it is (“Patient”). Birth date is a separate field. ${need}` },
  ];
  return <details className={styles.readAlong}>
    <summary>Walk me through this request</summary>
    <div className={styles.readAlongBody}>
      <div aria-live="polite" aria-atomic="true"><small>Evidence {step + 1} of {clues.length}</small>
        <h3>{clues[step].title}</h3><p>{clues[step].text}</p>
      </div>
      <div><button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
        {step < clues.length - 1 ? <button type="button" onClick={() => setStep(step + 1)}>Next clue</button>
          : <button type="button" onClick={onFinish}>Explore packet choices</button>}</div>
    </div>
  </details>;
}

function ResearchRequest({ selection, consent, plan, onChange, evidenceHref }: {
  selection: number; consent: boolean | null; plan?: PacketPlan;
  onChange: (index: number, granted?: boolean, decision?: PacketPlan) => void; evidenceHref: string;
}) {
  const scenario = comparisons[selection];
  const patient = DEMO_PATIENTS.find(item => item.id === "patient-eu-001");
  const firstChoice = useRef<HTMLButtonElement>(null);
  const [comparison, setComparison] = useState<{ plan: PacketPlan; consent: boolean; message: string } | null>(null);
  if (!patient) return null;
  const team = scenario.requester === "us-clinician" ? "US clinician team" : requesterPresets.find(item => item.value === scenario.requester)?.label;
  const receipt = plan && consent !== null ? handoffFor(scenario, consent, plan) : null;
  function decide(next: PacketPlan) {
    if (consent === null) return;
    if (receipt && plan && plan !== next) {
      const label = plans.find(item => item.key === plan)?.label;
      setComparison({ plan: next, consent, message: `Previous choice · ${label}. ${receipt.finding} · ${receipt.fields.length} fields prepared. Anna’s consent stayed the same.` });
    } else setComparison(null);
    if (next !== "hold") simulatePatient("patient-eu-001", scenario.purpose, scenario.requester);
    onChange(selection, consent, next);
  }
  function replay() {
    if (consent === null || !plan || !receipt) return;
    if (!simulateConsent("patient-eu-001", scenario.purpose, !consent).ok) return;
    const nextReceipt = handoffFor(scenario, !consent, plan);
    setComparison({ plan, consent: !consent, message: `Same request and steward decision. ${consent ? "Granted" : "Withheld"} consent prepared ${receipt.fields.length} fields. ${!consent ? "Granted" : "Withheld"} consent prepares ${nextReceipt.fields.length}. Before the change · ${receipt.finding}.` });
    if (plan !== "hold") simulatePatient("patient-eu-001", scenario.purpose, scenario.requester);
    onChange(selection, !consent, plan);
  }
  function resetSession() {
    resetSelectedPatient();
    resetAccessContext();
    resetDemo();
    setComparison(null);
    onChange(0);
  }
  return <section id="research-request" tabIndex={-1} className={styles.case} aria-label="Access request intake">
    <fieldset className={styles.selector}><legend>Open a request file</legend><div className={styles.options}>
      {comparisons.map((item, index) => <label key={item.id}><input type="radio" name="request-scenario" checked={index === selection} onChange={() => onChange(index)}/>{item.label}</label>)}
    </div></fieldset>
    <div className={styles.story}><p className={styles.recordId}>{scenario.id} · Synthetic record {patient.id}</p><h2>{patient.name}</h2>
      <p>{scenario.detail}</p>
      <dl className={styles.facts}>
        <div><dt>Record holder</dt><dd>{patient.organization} ({patient.region})</dd></div>
        <div><dt>Purpose</dt><dd>{purposeLabels[scenario.purpose]}</dd></div>
        <div><dt>Requested by</dt><dd>{team}</dd></div>
        <div><dt>Fields requested</dt><dd>{requestedFields[scenario.purpose].map(field => fieldLabels[field]).join(" · ")}</dd></div>
        <div><dt>Purpose consent</dt><dd>{consent === null ? "Loading preference" : consent ? "Granted" : "Withheld"}</dd></div>
      </dl>
      <EvidenceWalkthrough purpose={scenario.purpose} consent={consent} onFinish={() => firstChoice.current?.focus()}/>
    </div>
    <div className={styles.request}>
      <h3>What would you prepare?</h3>
      <p>A packet is the set of fields you propose to share. Try the team’s full request, just the record ID and type, or a hold that pauses work before a read. Each choice previews what the receiving team could do.</p>
      <div className={styles.packetActions} role="group" aria-label="Steward decision">{plans.map(item => <button key={item.key} ref={item.key === "requested" ? firstChoice : undefined} type="button" disabled={consent === null} aria-pressed={plan === item.key} onClick={() => decide(item.key)}>{item.label}</button>)}</div>
      {receipt && <section className={styles.packetResult} aria-label={scenario.receiver} aria-live="polite" aria-atomic="true">
        <p className={styles.kicker}>Local packet preview</p><h3>{scenario.receiver}</h3><p>{receipt.finding}</p><strong>{receipt.fields.length} fields prepared</strong>
        {receipt.fields.length > 0 && <p>{receipt.fields.map(field => fieldLabels[field]).join(" · ")}</p>}<p>{receipt.explanation}</p>
      </section>}
      <div className={styles.requestActions}><a href={evidenceHref}>Inspect this request’s field evidence</a></div>
    </div>
    {receipt && <section className={styles.consentEvent} aria-label="Compare one change">
      <div><h3>Change one thing and compare</h3>
        <p>{plan === "hold" ? "Keep Anna’s choice and try the requested packet. What happens when the desk actually checks the request?"
          : !consent ? "Keep the team and packet fixed. Try a scenario where Anna grants permission, then look again at what the team could use."
          : scenario.purpose === "treatment" ? "Keep the team and packet fixed. Try a scenario where Anna withdraws permission and compare the reasons for the result."
          : "Keep Anna’s consent fixed and change the packet size. Which part of the team’s task can it complete?"}</p></div>
      <div className={styles.compareActions}>
        {(plan === "hold" || (consent && scenario.purpose !== "treatment")) && <button type="button" className={styles.eventButton} onClick={() => decide(plan === "requested" ? "identifiers" : "requested")}>{plan === "requested" ? "Compare identifiers only" : "Compare requested fields"}</button>}
        <button type="button" className={styles.eventButton} onClick={replay}>{consent ? "Replay Anna’s withdrawal" : "Replay Anna’s grant"}</button>
      </div>
      {comparison && comparison.plan === plan && comparison.consent === consent && <p role="status">{comparison.message} <strong>Current result · {receipt.finding} ({receipt.fields.length} fields).</strong></p>}
    </section>}
    <details className={styles.session}><summary>Session settings and reset</summary>
      <p>The request link carries the selected case and packet decision. Anna’s synthetic consent and activity are local to this tab. Reset restores the initial preferences and clears the decision.</p>
      <button className={styles.eventButton} type="button" onClick={resetSession}>Reset tab demo</button>
    </details>
  </section>;
}

const assumptions = [
  { key: "requests", label: "Eligible requests per month", initial: "300", min: 1, max: 1000000 },
  { key: "minutes", label: "Minutes saved per request", initial: "5", min: 0, max: 480 },
  { key: "rate", label: "Loaded hourly rate ($)", initial: "60", min: 1, max: 1000 },
  { key: "cost", label: "First-year cost ($)", initial: "14400", min: 0, max: 100000000 },
] as const;

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function PilotWorksheet({ scenario }: { scenario: string }) {
  const [choice, setChoice] = useState("");
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
    <section id="pilot-costs" tabIndex={-1} className={styles.worksheet} aria-labelledby="pilot-heading">
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
        <fieldset className={styles.pilotChoice}><legend>What would you fund?</legend>{["Keep manual review", "Introduce a checklist", "Run a shadow pilot"].map(item => <button type="button" key={item} aria-pressed={item === choice} onClick={() => setChoice(item)}>{item}</button>)}</fieldset>
        <p role="status" aria-atomic="true">{choice && <><strong>{scenario} · {choice}.</strong> {choice === "Keep manual review" ? "Log the steward’s decision and time through resolution. Sample both released and held requests." : choice === "Introduce a checklist" ? "Have the steward verify requester, consent and returned fields on matched cases. Measure exceptions and time before funding automation." : invalid ? "Complete the cost inputs before assessing pilot capacity." : difference > 0 ? "Your assumptions cover first-year cost. Test those minutes against the better baseline and stop on an unauthorized field." : "Your assumptions do not exceed first-year cost. Revisit measured reviewer time or pilot cost before expanding."}</>}</p>
        <details><summary>How exchange teams evaluate this kind of work</summary>
          <p>Maryland’s CRISP exchange describes investigators applying for research use and separate committees reviewing use cases. AHRQ’s exchange evaluation guide asks teams to identify stakeholders, objectives and feasible measures. Those sources informed the roles and pilot criteria in this fictional case. <a href="https://www.crisphealth.org/research/">CRISP research access</a> · <a href="https://digital.ahrq.gov/health-information-exchange-hie-evaluation-toolkit">AHRQ exchange evaluation guide</a></p>
        </details>
        <p>HL7 describes the Patient resource as demographic and administrative data. The study roster and age check are fictional uses of those fields. <a href="https://hl7.org/fhir/R4/patient.html">FHIR Patient</a> · ONC explains how organizations exchange information electronically and maintain patient choices. <a href="https://healthit.gov/health-it-basics/hie/">What is health information exchange?</a> HL7’s FHIR R4 Consent model represents recipient, purpose, and policy context. The EU and US decisions above follow this project’s synthetic rules. <a href="https://healthit.gov/privacy-security/patient-consent-electronic-health-information-exchange/">ONC consent guidance</a> · <a href="https://hl7.org/fhir/R4/consent-definitions.html">HL7 Consent definitions</a></p>
      </div>
    </section>
  );
}
