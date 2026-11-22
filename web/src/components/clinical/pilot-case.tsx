"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { CredentialProfile } from "@/lib/api";
import { DEMO_EVENT, DEMO_PATIENTS, getDemoConsent, resetDemo, simulateConsent, simulatePatient, type DemoPurpose } from "@/lib/demo";
import { resetSelectedPatient } from "./patient-selector";
import { requesterPresets, resetAccessContext } from "./use-access-context";
import { ArrowRightLeft, Files, Globe2, KeyRound, Users } from "lucide-react";
import { WalkthroughLauncher } from "@/components/walkthrough/guided-walkthrough";
import styles from "./pilot-case.module.css";

const comparisons = [
  { label: "Research request", purpose: "research", requester: "eu-visiting", question: "Does Anna’s treatment permission also cover research?", detail: "A study coordinator wants to use the record for research. In the initial case Anna permits bedside treatment and withholds research consent." },
  { label: "Different region", purpose: "treatment", requester: "us-home", question: "Can the US home team read the same record for treatment?", detail: "Anna’s record belongs to the European cell. Keep treatment consent in place and see what changes when the requester is in the United States." },
  { label: "Limited return", purpose: "derivative", requester: "us-clinician", question: "Which fields can the permitted US team receive?", detail: "The fixture gives one US team permission to request a limited derivative. Compare the returned fields with a full same-region response." },
] satisfies { label: string; purpose: DemoPurpose; requester: CredentialProfile; question: string; detail: string }[];

const purposeLabels: Record<DemoPurpose, string> = {
  research: "Research",
  treatment: "Treatment",
  derivative: "Limited derivative",
};

export function CasePage() {
  return (
    <div className={styles.casePage}>
      <header className={styles.masthead}>
        <span><ArrowRightLeft aria-hidden="true" /> Healthcare Data Exchange</span>
        <nav aria-label="Case sections"><a href="#pilot-costs">Pilot costs</a><a href="#technical">Evidence &amp; methods</a></nav>
      </header>
      <div className={styles.caseBody}>
        <div className={styles.caseHeading}>
          <p className={styles.kicker}>Research access · Synthetic case</p>
          <h1>Privacy desk intake</h1>
          <p>As data steward, decide what the requester may receive. The exchange operations director can then weigh a shadow pilot.</p>
        </div>
        <ResearchRequest />
        <PilotWorksheet />
        <section className={styles.technical} id="technical" aria-labelledby="technical-heading">
          <div><p className={styles.kicker}>Technical guide</p><h2 id="technical-heading">Evidence &amp; methods</h2></div>
          <details>
            <summary>Inspect the model and its evidence</summary>
            <p>The access diagram calls the same browser fixture as Patient access. Each check reads this tab’s consent, evaluates the team and region, and writes an entry in Activity. The four synthetic patient records come from the project’s FHIR samples.</p>
            <p>The separate local gateway verifies credentials and runs policy through OPA. OPAL distributes consent changes. The browser’s activity list records simulated outcomes and cannot establish server enforcement.</p>
            <p><a href="https://github.com/SafetyMP/Healthcare-Data-Exchange/tree/main/fhir/samples">FHIR samples</a> · <a href="https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/main/web/src/lib/demo.ts">Browser rules</a> · <a href="https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/main/docs/architecture/overview.md">Gateway architecture</a></p>
          </details>
          <div className={styles.tools}>
            <div><Link href="/patients">Open technical workspace</Link><p>Test other patients, edit consent, or inspect the simulated activity trail.</p></div>
            <WalkthroughLauncher className="primary-link" />
          </div>
        </section>
      </div>
    </div>
  );
}

const possibleOutcomes = ["Deny access", "Allow access", "Limit fields"] as const;
type Outcome = typeof possibleOutcomes[number];
const fixtureFields = ["id", "resourceType", "name", "birthDate", "gender"];

function checkRequest(patientId: string, purpose: DemoPurpose, requester: CredentialProfile) {
  const result = simulatePatient(patientId, purpose, requester);
  const fields = result.ok && Array.isArray(result.data.min_necessary_fields)
    ? result.data.min_necessary_fields.filter((field): field is string => typeof field === "string")
    : [];
  const outcome: Outcome = !result.ok ? "Deny access" : result.data.exception_label === "cross_bloc_derivative" ? "Limit fields" : "Allow access";
  return { fields, outcome, message: result.ok ? "The fixture permits these fields." : result.error };
}

type Check = ReturnType<typeof checkRequest>;
type Lesson = { prediction: Outcome; first: Check; event?: { before: Check; after: Check; granted: boolean } };

function subscribeToConsent(listener: () => void) {
  window.addEventListener(DEMO_EVENT, listener);
  return () => window.removeEventListener(DEMO_EVENT, listener);
}

function FieldReceipt({ title, check }: { title: string; check: Check }) {
  return <div className={styles.receipt}>
    <h4>{title} · {check.outcome}</h4>
    <p><b>Released</b> {check.fields.join(", ") || "None"}</p>
    <p><b>Withheld</b> {fixtureFields.filter(field => !check.fields.includes(field)).join(", ") || "None"}</p>
  </div>;
}

function ResearchRequest() {
  const [selection, setSelection] = useState(0);
  const [prediction, setPrediction] = useState<Outcome | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const scenario = comparisons[selection];
  const patient = DEMO_PATIENTS.find(item => item.id === "patient-eu-001");
  const consent = useSyncExternalStore<boolean | null>(subscribeToConsent,
    () => getDemoConsent("patient-eu-001", scenario.purpose), () => null);
  const trace = lesson?.event?.after ?? lesson?.first;
  if (!patient) return null;
  const team = requesterPresets.find(item => item.value === scenario.requester);
  const query = new URLSearchParams({ patient: patient.id, purpose: scenario.purpose, requester: scenario.requester });
  function runCheck() {
    if (!patient || !prediction) return;
    setLesson({ prediction, first: checkRequest(patient.id, scenario.purpose, scenario.requester) });
  }
  function replayConsent() {
    if (!patient || !lesson || !trace || consent === null) return;
    const granted = !consent;
    const update = simulateConsent(patient.id, scenario.purpose, granted);
    if (update.ok) {
      const after = checkRequest(patient.id, scenario.purpose, scenario.requester);
      setLesson({ ...lesson, event: { before: trace, after, granted } });
    }
  }
  function selectRequest(index: number) {
    setSelection(index);
    setPrediction(null);
    setLesson(null);
  }
  function resetSession() {
    resetSelectedPatient();
    resetAccessContext();
    resetDemo();
    selectRequest(0);
  }
  return (
    <section id="research-request" className={styles.case} aria-label="Access request intake">
      <fieldset className={styles.selector}>
        <legend>Request to review</legend>
        <div className={styles.options}>{comparisons.map((item, index) =>
          <label key={item.label}>
            <input type="radio" name="request-scenario" checked={index === selection} onChange={() => selectRequest(index)} />
            {item.label}
          </label>
        )}</div>
      </fieldset>
      <div className={`intro-copy ${styles.story}`}>
        <p className={styles.recordId}>Synthetic patient · {patient.id}</p>
        <h2>{patient.name}</h2>
        <dl className={styles.facts}>
          <div><dt>Home region</dt><dd>{patient.organization} ({patient.region})</dd></div>
          <div><dt>Purpose</dt><dd>{purposeLabels[scenario.purpose]}</dd></div>
          <div><dt>Requested by</dt><dd>{team?.label}</dd></div>
          <div><dt>Purpose consent</dt><dd>{consent === null ? "Loading preference" : consent ? "Granted" : "Withheld"}</dd></div>
        </dl>
      </div>
      <div className={styles.request}>
        <div aria-live="polite">
          <h3>{scenario.question}</h3>
          <p>{scenario.detail}</p>
        </div>
        <fieldset className={styles.predict}>
          <legend>Predict the decision</legend>
          <div className={styles.options}>{possibleOutcomes.map(outcome =>
            <label key={outcome}><input type="radio" name="prediction" checked={outcome === prediction}
              onChange={() => { setPrediction(outcome); setLesson(null); }} />{outcome}</label>
          )}</div>
        </fieldset>
        <div className={styles.requestActions}>
          <button className="primary-link" type="button" onClick={runCheck} disabled={!prediction || consent === null}>Run access check</button>
          <Link href={`/patients?${query}`}>Open this access check</Link>
        </div>
      </div>
      <figure className={styles.trace} aria-label="Synthetic access decision path" aria-live="polite">
        <figcaption>Decision path{lesson?.event ? lesson.event.granted ? " after Anna’s grant" : " after Anna’s withdrawal" : ""}</figcaption>
        <ol>
          <li><Users aria-hidden="true" /><span>Requester</span><strong>{team?.label}</strong></li>
          <li><KeyRound aria-hidden="true" /><span>Purpose consent</span><strong>{consent === null ? "Loading" : consent ? "Granted" : "Withheld"}</strong></li>
          <li><Globe2 aria-hidden="true" /><span>Region</span><strong>{scenario.requester.startsWith("us-") ? "US team · EU record" : "EU team · EU record"}</strong></li>
          <li><Files aria-hidden="true" /><span>Returned fields</span><strong>{trace ? trace.fields.length ? trace.fields.join(", ") : "None" : "Awaiting check"}</strong></li>
        </ol>
        {lesson && <p><strong>{lesson.prediction === lesson.first.outcome ? "Prediction matched." : "Prediction differed."}</strong> For the first check, you chose {lesson.prediction.toLowerCase()} and the model returned {lesson.first.outcome.toLowerCase()}. {lesson.event ? "The diagram shows the latest check after Anna’s event." : lesson.first.message}</p>}
      </figure>
      {lesson && <section className={styles.replay} aria-labelledby="patient-event">
        <h3 id="patient-event">What if Anna changes her consent?</h3>
        <p>Replay a synthetic patient event. Anna chooses whether to grant or withdraw consent for {purposeLabels[scenario.purpose].toLowerCase()}. As steward, check the same team and purpose again.</p>
        <button type="button" className={styles.eventButton} onClick={replayConsent}>{consent ? "Replay Anna’s withdrawal" : "Replay Anna’s grant"}</button>
        <div className={styles.receipts} aria-live="polite">
          {lesson.event ? <>
            <FieldReceipt title="Before the event" check={lesson.event.before} />
            <FieldReceipt title={lesson.event.granted ? "After Anna’s grant" : "After Anna’s withdrawal"} check={lesson.event.after} />
            <p>{lesson.event.after.message}</p>
          </> : <FieldReceipt title="Current check" check={lesson.first} />}
        </div>
      </section>}
      <details className={styles.session}>
        <summary>Session settings and reset</summary>
        <p>Consent and activity carry into the technical workspace and survive a reload in this tab when session storage is available. Predictions and comparisons clear when you leave or reload. Reset restores the original synthetic consents and clears activity and walkthrough progress.</p>
        <button type="button" className={styles.eventButton} onClick={resetSession}>Reset tab demo</button>
      </details>
    </section>
  );
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
