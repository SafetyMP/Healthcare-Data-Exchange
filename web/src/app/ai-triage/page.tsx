"use client";

import { ArrowRight, CircleCheck, Eye, Sparkles } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";

import { PatientSelector, ResponseDetails, useSelectedPatient } from "@/components/clinical/patient-selector";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ApiResult, postAiTriage } from "@/lib/api";
import { DEMO_EVENT, IS_DEMO } from "@/lib/demo";

export default function AiTriagePage() {
  return <Suspense fallback={<p role="status">Loading patient context…</p>}><AiTriageContent /></Suspense>;
}

function AiTriageContent() {
  const { patientId, setPatientId } = useSelectedPatient();
  const [symptoms, setSymptoms] = useState("Example symptom A, example symptom B");
  const [storedResult, setResult] = useState<ApiResult<Record<string, unknown>> | null>(null);
  const [resultPatientId, setResultPatientId] = useState(patientId);
  // Never show a prior patient's response, including the render before effects run.
  const result = resultPatientId === patientId ? storedResult : null;
  const [loading, setLoading] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    // Patient context may change through browser navigation, outside form handlers.
    requestVersion.current += 1;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(null);
    setLoading(false);
  }, [patientId]);

  function clearResult() { requestVersion.current += 1; setResult(null); setLoading(false); }

  useEffect(() => {
    const reset = () => { requestVersion.current += 1; setResult(null); setLoading(false); };
    window.addEventListener(DEMO_EVENT, reset);
    return () => window.removeEventListener(DEMO_EVENT, reset);
  }, []);

  async function runExample(event: React.FormEvent) {
    event.preventDefault();
    const version = ++requestVersion.current;
    setLoading(true);
    setResultPatientId(patientId);
    setResult(null);
    const response = await postAiTriage({ patient_id: patientId, symptoms: symptoms.split(",").map((value) => value.trim()).filter(Boolean) });
    if (!IS_DEMO && version !== requestVersion.current) return;
    setResult(response);
    setLoading(false);
  }

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="EXPLORE / HUMAN OVERSIGHT" title="AI oversight" description="Explore how an illustrative AI output is held for human review." />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
        <section className="rounded-xl border border-border bg-card p-6 sm:p-7"><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-primary" aria-hidden /><h2 className="text-lg font-semibold">Create an example for review</h2></div><p className="mt-3 text-sm leading-relaxed text-muted-foreground">This fixed-output stub demonstrates a review boundary. It does not assess symptoms or provide medical advice.</p><form onSubmit={runExample} className="mt-6 space-y-5"><PatientSelector value={patientId} onChange={(value) => { clearResult(); setPatientId(value); }} /><div className="space-y-2"><label htmlFor="symptoms" className="text-sm font-medium">Synthetic example inputs</label><Input id="symptoms" value={symptoms} onChange={(event) => { clearResult(); setSymptoms(event.target.value); }} required /><p className="text-xs text-muted-foreground">Comma-separated examples only. Do not enter real health information.</p></div><Button type="submit" disabled={loading || !symptoms.split(",").some((value) => value.trim())}>{loading ? "Creating example…" : "Run oversight example"}<ArrowRight className="h-4 w-4" aria-hidden /></Button></form></section>
        <aside className="rounded-xl border border-border bg-card p-6"><Eye className="mb-4 h-7 w-7 text-primary" aria-hidden /><h2 className="text-lg font-semibold">A person remains in the loop</h2><ol className="mt-5 space-y-5">{[{ title: "Generate an example", description: "A fixed stub produces an illustrative output." }, { title: "Hold for review", description: "The output is marked as requiring human oversight." }, { title: "No automatic clinical action", description: "This demo does not approve decisions or initiate care." }].map((step, index) => <li key={step.title} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-muted text-xs font-semibold text-primary">{index + 1}</span><div><p className="text-sm font-medium">{step.title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.description}</p></div></li>)}</ol></aside>
      </div>
      <div aria-live="polite" aria-atomic="true">{result?.ok && <section className="rounded-xl border border-warning/40 bg-card p-6"><div className="flex items-start gap-3"><CircleCheck className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden /><div><span className="rounded-full bg-warning-muted px-3 py-1 text-xs font-semibold">{result.data.human_oversight_required === true ? "Human review required" : "Inspect oversight response"}</span><h2 className="mt-3 text-xl font-semibold">Example created for review</h2><p className="mt-2 text-sm text-muted-foreground">{IS_DEMO ? "Simulated output. " : "Stub service output. "}No clinical action has been taken.</p></div></div><dl className="mt-6 grid gap-5 sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Review status</dt><dd className="mt-1 text-sm font-medium">{result.data.status === "pending_human_oversight" ? "Pending human oversight" : typeof result.data.status === "string" ? result.data.status : "See technical response"}</dd></div><div><dt className="text-xs text-muted-foreground">Output type</dt><dd className="mt-1 text-sm font-medium">Fixed demonstration · not a clinical assessment</dd></div></dl><ResponseDetails data={result.data} /></section>}{result && !result.ok && <section role="alert" className="rounded-xl border border-warning/40 bg-card p-6"><h2 className="font-semibold">Unable to create the example</h2><p className="mt-2 text-sm text-muted-foreground">{result.status === 0 ? "The gateway could not be reached. Check the backend connection and try again." : result.error}</p></section>}</div>
    </div>
  );
}
