"use client";

import { PublicationCheck } from "./case-evidence";
import { operatorHref, operatorResult, type OperatorRoute } from "./operator-model";
import common from "./pilot-case.module.css";
import guide from "./case-evidence.module.css";

const exchange = "https://github.com/SafetyMP/Healthcare-Data-Exchange/blob/";
const implementation = exchange + "3bc012d5833eb5ce5fcd0811ce39e3b9145fe278/";
const publishedRule = exchange + "e46ea1106276cd36ae73bc229ca4778b8e5b2c4d/policy/authz.rego";
const stamp = implementation + ".harness/policy-sync-stamp";
const pointer = "https://github.com/SafetyMP/healthcare-policy/blob/b544d2f377e491eb0d43d2fcdb4078743e9fc94c/.harness/canonical-pointer";

const stages = [
  ["rule", "Canonical rule", "Which rule applies?"],
  ["mirror", "Published mirror", "Which rules were published?"],
  ["consent", "Consent update", "How does the update reach the evaluator?"],
  ["gateway", "Gateway check", "What did the gateway observe?"],
] as const;

export function OperatorGuide({ route }: { route: OperatorRoute }) {
  const active = stages.find(([key]) => key === route.stage) ?? stages[0];
  const result = route.choice && operatorResult(route.packet, route.choice);
  const decision = route.choice === "confirm" ? "Confirm denial" : route.choice === "verify" ? "Request verification" : "Decision open";
  const file = route.packet === "a" ? "File A" : "File B";

  return <article className={common.technicalGuide + " " + guide.guide}>
    <a href={operatorHref({ ...route, guide: false })}>Return to the operator case</a>
    <header className={common.caseHeading}>
      <p className={common.kicker}>Exchange operations · Technical guide</p>
      <h1 tabIndex={-1} id="operator-guide-title">Trace the withdrawal</h1>
      <p>Follow Anna Mueller’s research request to the European record gateway. The publication records come from Git. The withdrawal and receiver files are simulated.</p>
    </header>
    <dl className={common.techFacts}>
      <div><dt>Requester and purpose</dt><dd>EU visiting team · research</dd></div>
      <div><dt>Record and evidence</dt><dd>patient-eu-001 · {file}</dd></div>
      <div><dt>Your decision</dt><dd>{decision}</dd></div>
    </dl>
    <nav className={common.stageNav} aria-label="Technical stages">
      {stages.map(([stage, label]) => <a key={stage}
        href={operatorHref({ ...route, guide: true, stage })}
        aria-current={route.stage === stage ? "step" : undefined}>{label}</a>)}
    </nav>
    <section className={common.stagePanel} aria-labelledby="operator-stage-title">
      <h2 id="operator-stage-title">{active[2]}</h2>
      {route.stage === "rule" && <>
        <p>Healthcare Data Exchange owns the access rule. Its published research rule asks Open Policy Agent (OPA), the rule evaluator, to check the research consent flag for the patient named in the request. The gateway also checks who is asking and where the record is held.</p>
        <p className={guide.observation}>For this request the rule looks up the research flag for <code>patient-eu-001</code>. Both files use the same rule and requester.</p>
        <p><a href={publishedRule + "#L42-L51"}>Published research consent rule</a> · <a href={implementation + "services/gateway/internal/handlers/handlers.go#L95-L119"}>Verified gateway caller</a></p>
      </>}
      {route.stage === "mirror" && <>
        <p>The policy mirror is the copy that OPAL watches for rule changes. A Git commit identifies a revision. A SHA-256 digest is a fingerprint of the rule files in that revision.</p>
        <p className={guide.observation}>The canonical publication stamp names <code>e46ea110</code>. The mirror’s pointer names <code>1808fa17</code>. Both record the same July 19 bundle digest, <code>69ef166e…766309</code>. This is evidence about the rule files available to receivers.</p>
        <p><a href={stamp}>Canonical publication stamp</a> · <a href={pointer}>Mirror revision and digest</a> · <a href={implementation + "scripts/check-portfolio-cross-repo.sh#L29-L47"}>Cross-repository content check</a></p>
        <details><summary>Compare bundle fingerprints</summary><PublicationCheck /></details>
      </>}
      {route.stage === "consent" && <>
        <p>The consent service changes Anna’s research flag and asks OPAL, the distribution service, to refresh consent data. Each OPAL client fetches the data and supplies it to its evaluator separately from rule updates.</p>
        <p className={guide.observation}>At 09:00 UTC the operator’s file records the withdrawal. The consent service reports that OPAL accepted the publication request. A receiver check supplies the next piece of evidence.</p>
        <p><a href={implementation + "services/consent-service/chex_consent/main.py#L85-L108"}>Consent write and acknowledgement</a> · <a href={implementation + "services/consent-service/chex_consent/opal_publish.py#L62-L86"}>Publication request</a> · <a href={implementation + "deploy/docker-compose.yml#L128-L132"}>OPAL rule and data sources</a></p>
      </>}
      {route.stage === "gateway" && <>
        <p>The connected gateway passes the verified caller, subject and purpose to OPA. On a denial it records the reason and returns HTTP 403 before reading the patient resource.</p>
        <p className={guide.observation}><strong>{file} · European record gateway.</strong>{" "}
          {route.packet === "a"
            ? "At the 09:10 UTC cutoff, no gateway return is attached for this research request."
            : "At 09:08 UTC the simulated matching read returned HTTP 403 with reason consent_required and zero patient fields."}</p>
        {result ? <>
          <p><strong>Report to the privacy officer.</strong> {result.report}</p>
          <p><strong>Still unknown.</strong> {result.unknown}</p>
          <p><strong>Next owner.</strong> {result.owner}</p>
        </> : <p>Return to the operator case to record a decision on this evidence.</p>}
        <p><a href={implementation + "services/gateway/internal/handlers/handlers.go#L130-L169"}>Gateway decision and response</a> · <a href={implementation + "scripts/demo.sh#L175-L189"}>Separate Compose probe with a different test patient</a></p>
      </>}
    </section>
  </article>;
}
