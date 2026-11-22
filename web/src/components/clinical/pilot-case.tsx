"use client";

import Link from "next/link";
import { useState } from "react";
import type { CredentialProfile } from "@/lib/api";
import { DEMO_PATIENTS, getDemoConsent, simulatePatient, type DemoPurpose } from "@/lib/demo";
import { requesterPresets } from "./use-access-context";
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

function ResearchRequest() {
  const [selection, setSelection] = useState(0);
  const [trace, setTrace] = useState<{ consent: boolean; fields: string[]; message: string } | null>(null);
  const scenario = comparisons[selection];
  const patient = DEMO_PATIENTS.find(item => item.id === "patient-eu-001");
  if (!patient) return null;
  const team = requesterPresets.find(item => item.value === scenario.requester);
  const query = new URLSearchParams({ patient: patient.id, purpose: scenario.purpose, requester: scenario.requester });
  function runCheck() {
    if (!patient) return;
    const consent = getDemoConsent(patient.id, scenario.purpose);
    const result = simulatePatient(patient.id, scenario.purpose, scenario.requester);
    const fields = result.ok && Array.isArray(result.data.min_necessary_fields)
      ? result.data.min_necessary_fields.filter((field): field is string => typeof field === "string")
      : [];
    setTrace({ consent, fields, message: result.ok ? "Access allowed" : result.error });
  }
  return (
    <section id="research-request" className={styles.case} aria-label="Access request intake">
      <fieldset className={styles.selector}>
        <legend>Request to review</legend>
        <div className={styles.options}>{comparisons.map((item, index) =>
          <label key={item.label}>
            <input type="radio" name="request-scenario" checked={index === selection} onChange={() => { setSelection(index); setTrace(null); }} />
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
        </dl>
      </div>
      <div className={styles.request}>
        <div aria-live="polite">
          <h3>{scenario.question}</h3>
          <p>{scenario.detail}</p>
        </div>
        <div className={styles.requestActions}>
          <button className="primary-link" type="button" onClick={runCheck}>Run access check</button>
          <Link href={`/patients?${query}`}>Open this access check</Link>
        </div>
      </div>
      <figure className={styles.trace} aria-label="Synthetic access decision path" aria-live="polite">
        <figcaption>Decision path</figcaption>
        <ol>
          <li><Users aria-hidden="true" /><span>Requester</span><strong>{team?.label}</strong></li>
          <li><KeyRound aria-hidden="true" /><span>Purpose consent</span><strong>{trace ? trace.consent ? "Granted" : "Withheld" : "Awaiting check"}</strong></li>
          <li><Globe2 aria-hidden="true" /><span>Region</span><strong>{scenario.requester.startsWith("us-") ? "US team · EU record" : "EU team · EU record"}</strong></li>
          <li><Files aria-hidden="true" /><span>Returned fields</span><strong>{trace ? trace.fields.length ? trace.fields.join(", ") : "None" : "Awaiting check"}</strong></li>
        </ol>
        {trace && <p><strong>Result</strong> {trace.message}</p>}
      </figure>
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
