"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";

import { PatientSelector, ResponseDetails, selectClass, useSelectedPatient } from "@/components/clinical/patient-selector";
import { isAccessPurpose, requesterPresets, useAccessContext } from "@/components/clinical/use-access-context";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ApiResult, postConsent } from "@/lib/api";
import { DEMO_EVENT, getDemoConsent, IS_DEMO } from "@/lib/demo";
import { cn } from "@/lib/utils";
import { reportWalkthroughAction } from "@/lib/walkthrough";

export default function ConsentPage() {
  return <Suspense fallback={<p role="status">Loading consent context…</p>}><ConsentContent /></Suspense>;
}

function ConsentContent() {
  const { patientId, setPatientId, patient } = useSelectedPatient();
  const { purpose, credential, setPurpose, ready } = useAccessContext("research", patient?.region);
  const contextKey = `${patientId}:${purpose}:${credential}`;
  const [granted, setGranted] = useState(true);
  const [currentConsent, setCurrentConsent] = useState<boolean | null>(null);
  const [adminToken, setAdminToken] = useState("");
  const [storedResult, setResult] = useState<ApiResult<Record<string, unknown>> | null>(null);
  const [resultContext, setResultContext] = useState(contextKey);
  // Keep confirmation bound to the exact access context used for the change.
  const result = resultContext === contextKey ? storedResult : null;
  const [loading, setLoading] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    // Browser navigation can change any part of the request context.
    requestVersion.current += 1;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(null);
    setLoading(false);
  }, [contextKey]);

  useEffect(() => {
    const refresh = () => { if (IS_DEMO) { setCurrentConsent(getDemoConsent(patientId, purpose)); setResult(null); } };
    refresh();
    window.addEventListener(DEMO_EVENT, refresh);
    return () => window.removeEventListener(DEMO_EVENT, refresh);
  }, [patientId, purpose]);

  function clearResult() { requestVersion.current += 1; setResult(null); setLoading(false); }

  async function saveConsent(event: React.FormEvent) {
    event.preventDefault();
    const version = ++requestVersion.current;
    setLoading(true);
    setResultContext(contextKey);
    setResult(null);
    const response = await postConsent({ patient_id: patientId, purpose, granted, admin_token: adminToken });
    if (version !== requestVersion.current) return;
    setLoading(false);
    setResult(response);
    if (IS_DEMO) reportWalkthroughAction({ kind: "consent", patientId, purpose, credential, granted, ok: response.ok });
    if (response.ok) setAdminToken("");
  }

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="WORKSPACE / CONSENT" title="Consent management" description="Make the patient's sharing preferences visible, specific and easy to change." />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
        <section className="rounded-xl border border-border bg-card p-6 sm:p-7" aria-labelledby="consent-title">
          <h2 id="consent-title" className="text-lg font-semibold">Manage a sharing preference</h2>
          <p className="mt-2 text-sm text-muted-foreground">Consent applies to one patient and one purpose.</p>
          <form onSubmit={saveConsent} className="mt-6 space-y-6">
            <PatientSelector value={patientId} onChange={(value) => { clearResult(); setPatientId(value); }} />
            <div className="space-y-2"><label htmlFor="consent-purpose" className="text-sm font-medium">Purpose</label><select id="consent-purpose" className={selectClass} value={purpose} onChange={(event) => { const value = event.target.value; if (!isAccessPurpose(value)) return; clearResult(); setPurpose(value); }}><option value="research">Research</option><option value="treatment">Treatment</option><option value="derivative">Limited derivative</option></select></div>
            <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Next access check: <span className="font-medium text-foreground">{requesterPresets.find((preset) => preset.value === credential)?.label}</span>. Changing consent does not change this requesting team.</p>
            {IS_DEMO && <div className="flex items-center justify-between gap-3 rounded-lg bg-background p-4 text-sm"><span>Current demo consent</span><span className={cn("rounded-full px-3 py-1 text-xs font-semibold", currentConsent ? "bg-primary-muted text-primary" : "bg-warning-muted text-foreground")}>{currentConsent === null ? "Loading…" : currentConsent ? "Granted" : "Not granted"}</span></div>}
            {!IS_DEMO && <div className="space-y-2"><label htmlFor="admin-token" className="text-sm font-medium">Administrator token</label><Input id="admin-token" type="password" autoComplete="off" value={adminToken} onChange={(event) => { clearResult(); setAdminToken(event.target.value); }} required /><p className="text-xs text-muted-foreground">Required by the local gateway. The token is not saved.</p></div>}
            <fieldset><legend className="mb-3 text-sm font-medium">New preference</legend><div className="grid gap-3 sm:grid-cols-2">{[{ value: true, title: "Grant consent", text: "Allow this purpose, subject to regional rules." }, { value: false, title: "Revoke consent", text: "Block future access for this purpose." }].map((option) => <label key={option.title} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-4", granted === option.value ? "border-primary bg-primary-muted" : "border-border")}><input type="radio" name="consent-decision" checked={granted === option.value} onChange={() => { clearResult(); setGranted(option.value); }} className="mt-1 accent-primary" /><span><span className="block text-sm font-semibold">{option.title}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{option.text}</span></span></label>)}</div></fieldset>
            <Button type="submit" disabled={loading || !ready}>{loading ? "Saving consent…" : "Save consent"}<ArrowRight className="h-4 w-4" aria-hidden /></Button>
          </form>
        </section>
        <aside className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-6"><ShieldCheck className="mb-4 h-7 w-7 text-primary" aria-hidden /><h2 className="text-lg font-semibold">Choice stays with the patient</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Changing {patient?.name ?? "the patient"}&apos;s consent affects only the selected purpose. A research preference does not change treatment consent.</p><div className="my-5 h-px bg-border" /><p className="text-sm leading-relaxed text-muted-foreground">{IS_DEMO ? "Changes stay in this browser tab. Check access again to see the simulated result, or reset the demo to restore the starting scenario." : "The service publishes this change to the policy system. Check access again after propagation to verify its effect."}</p></section>
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">Granting consent does not bypass residency or credential checks. No production records or policies are changed by the browser demo.</p>
        </aside>
      </div>
      <div aria-live="polite" aria-atomic="true">
        {result?.ok && <section className="rounded-xl border border-primary/25 bg-card p-6"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden /><div><h2 className="text-lg font-semibold">Consent updated</h2><p className="mt-2 text-sm text-muted-foreground">{patient?.name}: {purpose} consent {granted ? "granted" : "revoked"}.{IS_DEMO ? " This is a browser-local change." : " Check access to verify policy propagation."}</p></div></div><Link href={`/patients?patient=${encodeURIComponent(patientId)}&purpose=${encodeURIComponent(purpose)}&requester=${encodeURIComponent(credential)}`} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4">Check patient access<ArrowRight className="h-4 w-4" aria-hidden /></Link><ResponseDetails data={result.data} /></section>}
        {result && !result.ok && <section role="alert" className="rounded-xl border border-warning/40 bg-card p-6"><h2 className="font-semibold">Consent was not updated</h2><p className="mt-2 text-sm text-muted-foreground">{result.status === 0 ? "The gateway could not be reached. Check the backend connection and try again." : result.error}</p><ResponseDetails data={result.body ?? { status: result.status, error: result.error }} /></section>}
      </div>
    </div>
  );
}
