"use client";

import Link from "next/link";
import { ArrowRight, Check, CircleCheck, FileText, LockKeyhole, Search, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ResponseDetails, selectClass, useSelectedPatient } from "@/components/clinical/patient-selector";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO_CREDENTIALS, type ApiResult, type CredentialProfile, getPatient } from "@/lib/api";
import { DEMO_EVENT, DEMO_PATIENTS, DEMO_RESET_EVENT, IS_DEMO } from "@/lib/demo";
import { cn } from "@/lib/utils";

const credentialOptions: { value: CredentialProfile; label: string }[] = [
  { value: "eu-visiting", label: "EU visiting care team" },
  { value: "eu-home", label: "EU home care team" },
  { value: "us-home", label: "US home care team" },
  { value: "us-clinician", label: "US care team · limited cross-region access" },
];

type Purpose = "treatment" | "research" | "derivative";

function returnedFields(data: Record<string, unknown>) {
  const source = typeof data.patient === "object" && data.patient !== null ? data.patient as Record<string, unknown> : data;
  const rows: { label: string; value: string }[] = [];
  if (Array.isArray(source.name)) {
    const first: unknown = source.name[0];
    if (typeof first === "object" && first !== null) {
      const name = first as Record<string, unknown>;
      const given = Array.isArray(name.given) ? name.given.filter((value): value is string => typeof value === "string").join(" ") : "";
      const family = typeof name.family === "string" ? name.family : "";
      if (given || family) rows.push({ label: "Name", value: [given, family].filter(Boolean).join(" ") });
    }
  }
  if (typeof source.birthDate === "string") rows.push({ label: "Date of birth", value: source.birthDate });
  if (typeof source.gender === "string") rows.push({ label: "Administrative gender", value: source.gender });
  if (typeof source.id === "string") rows.push({ label: "Record ID", value: source.id });
  return rows;
}

export default function PatientsPage() {
  const { patientId, setPatientId, patient } = useSelectedPatient();
  const [search, setSearch] = useState("");
  const [purpose, setPurpose] = useState<Purpose>("treatment");
  const [credential, setCredential] = useState<CredentialProfile>("eu-visiting");
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
  const credentialChosen = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedPurpose = params.get("purpose");
    // Hydrate the browser URL after the shared static HTML has mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (requestedPurpose === "treatment" || requestedPurpose === "research" || requestedPurpose === "derivative") setPurpose(requestedPurpose);
  }, []);

  useEffect(() => {
    if (!credentialChosen.current) setCredential(patient?.region === "US" ? "us-home" : "eu-visiting");
  }, [patient?.region]);

  useEffect(() => {
    const resetCredential = () => { credentialChosen.current = false; setCredential("eu-visiting"); };
    window.addEventListener(DEMO_RESET_EVENT, resetCredential);
    return () => window.removeEventListener(DEMO_RESET_EVENT, resetCredential);
  }, []);

  useEffect(() => {
    const reset = () => { requestVersion.current += 1; setResult(null); setLoading(false); };
    window.addEventListener(DEMO_EVENT, reset);
    return () => window.removeEventListener(DEMO_EVENT, reset);
  }, []);

  function clearResult() { requestVersion.current += 1; setResult(null); setLoading(false); }

  async function checkAccess(event: React.FormEvent) {
    event.preventDefault();
    const version = ++requestVersion.current;
    setLoading(true);
    setResultPatientId(patientId);
    setResult(null);
    const response = await getPatient(patientId, { purpose }, DEMO_CREDENTIALS[credential]);
    // Demo activity events can fire during a request; input edits still invalidate live requests.
    if (!IS_DEMO && version !== requestVersion.current) return;
    setResult(response);
    setLoading(false);
  }

  const visiblePatients = DEMO_PATIENTS.filter((item) => `${item.name} ${item.id} ${item.region}`.toLowerCase().includes(search.toLowerCase().trim()));
  const denied = result && !result.ok && result.status === 403;

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="WORKSPACE / PATIENTS" title="Patient access" description="Find a patient. Set the purpose. Understand what can be shared." />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.6fr)]">
        <section aria-labelledby="directory-title" className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border p-5">
            <div className="mb-4 flex items-center justify-between"><h2 id="directory-title" className="font-semibold">Patient directory</h2><span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{DEMO_PATIENTS.length} synthetic</span></div>
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden /><Input aria-label="Search synthetic patients" placeholder="Search name, ID or region" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" /></div>
          </div>
          <div className="space-y-1 p-2">
            {visiblePatients.map((item) => (
              <button key={item.id} type="button" aria-label={`${item.name} · ${item.region}`} aria-pressed={patientId === item.id} onClick={() => { clearResult(); setPatientId(item.id); }} className={cn("flex w-full items-center gap-3 rounded-lg border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", patientId === item.id ? "border-primary/25 bg-primary-muted" : "border-transparent hover:bg-muted")}>
                <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold", item.region === "EU" ? "bg-primary/10 text-primary" : "bg-warning-muted text-foreground")}>{item.initials}</span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.name}</span><span className="mt-1 block text-xs text-muted-foreground">{item.region} cell · {item.identifier}</span></span>
                {patientId === item.id && <Check className="h-4 w-4 text-primary" aria-hidden />}
              </button>
            ))}
            {visiblePatients.length === 0 && <div className="px-3 py-8 text-center text-sm text-muted-foreground"><p>No matching patients.</p><button type="button" onClick={() => setSearch("")} className="mt-3 font-medium text-primary underline underline-offset-4">Clear search</button></div>}
          </div>
          <p className="border-t border-border px-5 py-4 text-xs leading-relaxed text-muted-foreground">These are fictional records for exploring access and consent. No real patient data.</p>
        </section>

        <div className="space-y-5">
          <section aria-labelledby="request-title" className="rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-6"><div><p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">Selected patient</p><h2 id="request-title" className="text-xl font-semibold">{patient?.name ?? patientId}</h2></div><span className="rounded-full border border-border px-3 py-1.5 text-xs font-medium">{patient?.region} data region</span></div>
            <form onSubmit={checkAccess} className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><label htmlFor="purpose" className="text-sm font-medium">Purpose of access</label><select id="purpose" className={selectClass} value={purpose} onChange={(event) => { const value = event.target.value; if (value !== "treatment" && value !== "research" && value !== "derivative") return; clearResult(); setPurpose(value); }}><option value="treatment">Treatment</option><option value="research">Research</option><option value="derivative">Limited derivative</option></select></div>
                <div className="space-y-2"><label htmlFor="credential" className="text-sm font-medium">Requesting team</label><select id="credential" className={selectClass} value={credential} onChange={(event) => { clearResult(); credentialChosen.current = true; setCredential(event.target.value as CredentialProfile); }}>{credentialOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
              </div>
              <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{IS_DEMO ? "The simulation checks consent, the team's preset identity and regional sharing rules." : "The gateway verifies the selected demo credential before checking consent and regional policy."}</p>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">{loading ? "Checking access…" : "Check access"}<ArrowRight className="h-4 w-4" aria-hidden /></Button>
            </form>
          </section>

          <div aria-live="polite" aria-atomic="true">
            {!result && !loading && <section className="rounded-xl border border-dashed border-border p-7 text-center"><FileText className="mx-auto mb-3 h-7 w-7 text-muted-foreground" aria-hidden /><h2 className="font-semibold">A clear decision before data is shared</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">Check access to see the decision and the fields available for this purpose.</p></section>}
            {result?.ok && <section className="rounded-xl border border-primary/25 bg-card p-6"><div className="flex items-start gap-3"><CircleCheck className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden /><div><h2 className="text-lg font-semibold">Access allowed</h2><p className="mt-1 text-sm text-muted-foreground">{IS_DEMO ? "Simulated decision. " : "Gateway decision. "}Only the fields returned for this request appear below.</p></div></div><dl className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">{returnedFields(result.data).map((field) => <div key={field.label}><dt className="text-xs text-muted-foreground">{field.label}</dt><dd className="mt-1 break-words text-sm font-medium">{field.value}</dd></div>)}</dl>{result.data.cross_bloc === true && <p className="mt-4 rounded-lg bg-warning-muted p-3 text-sm">Limited cross-region derivative: identifying clinical fields are withheld.</p>}<ResponseDetails data={result.data} /></section>}
            {result && !result.ok && <section role="alert" className="rounded-xl border border-warning/40 bg-card p-6"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 h-6 w-6 shrink-0 text-warning" aria-hidden /><div><h2 className="text-lg font-semibold">{denied ? "Access blocked" : "Unable to check access"}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{result.status === 0 ? "The gateway could not be reached. Check that the local backend is running, then try again." : result.error}</p></div></div><div className="mt-5 flex flex-wrap gap-4 text-sm"><Link href={`/consent?patient=${encodeURIComponent(patientId)}&purpose=${encodeURIComponent(purpose)}`} className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline underline-offset-4">Review consent<ArrowRight className="h-4 w-4" aria-hidden /></Link><p className="self-center text-xs text-muted-foreground">Consent alone does not override regional restrictions.</p></div><ResponseDetails data={result.body ?? { status: result.status, error: result.error }} /></section>}
          </div>
        </div>
      </div>
    </div>
  );
}
