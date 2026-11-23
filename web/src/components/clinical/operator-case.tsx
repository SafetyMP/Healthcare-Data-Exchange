"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Database, GitBranch, Network } from "lucide-react";
import { OperatorGuide } from "./operator-guide";
import { operatorHref, operatorResult, type OperatorRoute } from "./operator-model";
import styles from "./operator-case.module.css";

function DistributionMap() {
  return <figure className={styles.map}>
    <figcaption>Two paths to the same gateway</figcaption>
    <div><GitBranch aria-hidden="true" /><p><strong>The access rule</strong><span>Engineering publishes the rule files in Git. The gateway’s policy engine uses a local copy.</span></p></div>
    <div><Database aria-hidden="true" /><p><strong>Anna’s consent</strong><span>The steward records the change. An update tells the receiver to fetch the latest consent data.</span></p></div>
    <div className={styles.merge}><Network aria-hidden="true" /><p><strong>European record gateway</strong><span>On each read, it checks the team, record and purpose against the rule and consent available there.</span></p></div>
  </figure>;
}

function Investment() {
  const [gateways, setGateways] = useState(2);
  const changes = 4;
  const coordinated = changes * gateways * (30 + 10);
  const independent = changes * (20 + gateways * 10) + 180;
  return <details className={styles.optional}>
    <summary>Would independent rule releases be worth operating?</summary>
    <p>The operations director can bundle rule changes with each gateway release or publish one shared rule through OPAL. In both approaches a release engineer still checks each receiver. Compare the same four monthly rule changes.</p>
    <fieldset><legend>Gateways in the proposed pilot</legend>
      {[2, 6].map(n => <button type="button" key={n} aria-pressed={gateways === n} onClick={() => setGateways(n)}>{n} gateways</button>)}
    </fieldset>
    <div className={styles.ledger} aria-live="polite">
      <p><strong>{coordinated} min/month</strong> · Coordinated releases. Allow 30 minutes to coordinate each gateway per change, plus 10 minutes to check it.</p>
      <p><strong>{independent} min/month</strong> · Independent publication. Allow 20 minutes to publish each change, 10 minutes to check each gateway, and three hours per month to operate distribution.</p>
    </div>
    <p>These estimates illustrate staff time. In a pilot, log actual release, verification and recovery time for the same changes and price setup separately. The privacy officer and patient representative should also agree how quickly a withdrawal must take effect. Test each endpoint against that target before making a timing commitment.</p>
  </details>;
}

function CaseDesk({ route }: { route: OperatorRoute }) {
  const [inspectedPacket, setInspectedPacket] = useState<OperatorRoute["packet"] | null>(null);
  const files = useRef<HTMLElement>(null);
  const previousPacket = useRef(route.packet);
  const read = inspectedPacket === route.packet || Boolean(route.choice);
  useEffect(() => {
    if (route.packet !== previousPacket.current) {
      previousPacket.current = route.packet;
      files.current?.querySelector<HTMLAnchorElement>('[aria-current="true"]')?.focus();
    }
  }, [route.packet]);
  const result = route.choice && operatorResult(route.packet, route.choice);
  function decide(choice: NonNullable<OperatorRoute["choice"]>) {
    window.location.hash = operatorHref({ ...route, choice });
  }
  return <>
    <section className={styles.opening} aria-labelledby="operator-title">
      <div><p className={styles.kicker}>Exchange operations · Synthetic case</p>
        <h1 id="operator-title" tabIndex={-1}>What can we tell Anna?</h1>
        <p>Anna Mueller has withdrawn permission for the visiting study team to read her European record for research. The exchange’s data steward has entered her choice. The team could request the same record again at its next roster review.</p>
        <p>The privacy officer needs an answer for Anna. You operate the gateway, the service that decides whether a request may reach the record. Can the officer say that Anna’s withdrawal has taken effect there?</p>
      </div><DistributionMap />
    </section>
    <section className={styles.stakes} aria-label="What is at stake">
      <p><strong>For Anna</strong> · An assurance based on the wrong evidence could leave her expecting privacy while a research read is still possible.</p>
      <p><strong>For staff and researchers</strong> · An unnecessary blanket hold can delay other authorized work and send staff to repeat checks. Anna’s withdrawn permission still stands.</p>
    </section>
    <section className={styles.paper} aria-labelledby="shift-file">
      <p className={styles.kicker}>Operator’s shift file · 09:10 UTC</p>
      <h2 id="shift-file">What has reached the receiver?</h2>
      <p>Both files replay the same handoff up to 09:10. Only the evidence returned by the European gateway changes.</p>
      <nav ref={files} aria-label="Select evidence file" className={styles.files}>
        {(["a", "b"] as const).map(packet => <a key={packet} aria-current={route.packet === packet ? "true" : undefined}
          href={operatorHref({ ...route, packet, choice: packet === route.packet ? route.choice : null })}>File {packet.toUpperCase()}</a>)}
      </nav>
      <dl className={styles.records}>
        <div><dt>Request under review</dt><dd>EU visiting research team · Anna Mueller (<code>patient-eu-001</code>) · research read at the European record gateway.</dd></div>
        <div><dt>09:00 · Consent service</dt><dd>Steward recorded “research withdrawn.” The service recorded acceptance of its request to publish the update.</dd></div>
        <div><dt>Rule publication</dt><dd>Both files use the July 19 published research policy. Its recorded bundle fingerprint begins <code>69ef166e</code>.</dd></div>
      </dl>
      <details key={route.packet} className={styles.receipt} open={route.choice ? true : undefined}
        onToggle={event => { if (event.currentTarget.open) setInspectedPacket(route.packet); }}>
        <summary>Inspect the receiver record · File {route.packet.toUpperCase()}</summary>
        {route.packet === "a" ? <p>The shift file contains the source update and publication record above. No matching gateway check is attached for the period after 09:00.</p>
          : <><p><strong>09:08 UTC · European record gateway</strong></p>
            <p>EU visiting study team · <code>patient-eu-001</code> · research read. Gateway response <strong>403</strong> (access denied), reason <code>consent_required</code>. No patient fields returned.</p></>}
        <small>Illustrative evidence in a browser exercise.</small>
      </details>
      <details className={styles.help}><summary>What should I look for?</summary><p>Who produced each record? Look for an observation made after the withdrawal at the gateway that will answer the next request. Check that it names the same team, patient and purpose, and explains the access decision.</p></details>
      <fieldset className={styles.decision} disabled={!read}>
        <legend>Can you confirm that this gateway will deny the next matching research request?</legend>
        <p>Assume the same inputs at this gateway. Choose what you would report to the privacy officer.{!read && " Inspect the receiver record first."}</p>
        <button type="button" aria-pressed={route.choice === "confirm"} onClick={() => decide("confirm")}>Confirm denial</button>
        <button type="button" aria-pressed={route.choice === "verify"} onClick={() => decide("verify")}>Request verification</button>
      </fieldset>
      <div aria-live="polite">{result && <section className={styles.answer} aria-labelledby="report">
        <h3 id="report">Report to the privacy officer</h3>
        <p>{result.report}</p>
        <dl className={styles.records}><div><dt>Still unknown</dt><dd>{result.unknown}</dd></div><div><dt>Next owner</dt><dd>{result.owner}</dd></div></dl>
        <p><a href={operatorHref({ ...route, packet: route.packet === "a" ? "b" : "a", choice: null })}>Try the other receiver file</a> with the same withdrawal and rule.</p>
      </section>}</div>
      <a className={styles.guideLink} href={operatorHref({ ...route, guide: true })}><BookOpen size={18} aria-hidden="true" />Trace this decision</a>
    </section>
    <Investment />
    <details className={styles.optional}><summary>Sources behind the handoff</summary><p>ONC describes the role of meaningful patient choice in exchange. CRISP describes the privacy officer’s responsibility for day-to-day privacy matters and its consumer council’s role in data-use policy. Anna, the times and the gateway observation are fictional.</p>
      <p><a href="https://healthit.gov/privacy-security/patient-consent-electronic-health-information-exchange/">ONC on patient consent</a> · <a href="https://www.crisphealth.org/governance/">CRISP governance</a> · <a href="https://docs.opal.ac/">OPAL policy and data distribution</a></p></details>
  </>;
}

export function OperatorCasePage({ route }: { route: OperatorRoute }) {
  const area = useRef<HTMLDivElement>(null);
  const previousScreen = useRef(route.guide);
  useEffect(() => {
    if (route.guide !== previousScreen.current) {
      previousScreen.current = route.guide;
      const heading = area.current?.querySelector("h1");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus();
      heading?.scrollIntoView({ block: "start" });
    }
  }, [route.guide]);
  return <div ref={area} className={styles.shell}>
    <header className={styles.mast}><span>Healthcare Data Exchange</span><a href="#research-request">Disclosure desk case</a></header>
    <div className={styles.inner}>
      {route.guide ? <OperatorGuide route={route} /> : <CaseDesk route={route} />}
    </div>
  </div>;
}
