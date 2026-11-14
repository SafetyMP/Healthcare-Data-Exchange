"use client";

import Link from "next/link";
import { ArrowRight, Fingerprint, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ResponseDetails, selectClass } from "@/components/clinical/patient-selector";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ApiResult, resolveIdentity } from "@/lib/api";
import { DEMO_EVENT, DEMO_PATIENTS, IS_DEMO } from "@/lib/demo";

export default function IdentityPage() {
  const [identifier, setIdentifier] = useState("urn:ehds:patient:eu-001");
  const [lookupType, setLookupType] = useState<"identifier" | "subject">("identifier");
  const [result, setResult] = useState<ApiResult<Record<string, unknown>> | null>(null);
  const [loading, setLoading] = useState(false);
  const requestVersion = useRef(0);

  function clearResult() { requestVersion.current += 1; setResult(null); setLoading(false); }

  useEffect(() => {
    const reset = () => { requestVersion.current += 1; setResult(null); setLoading(false); };
    window.addEventListener(DEMO_EVENT, reset);
    return () => window.removeEventListener(DEMO_EVENT, reset);
  }, []);

  async function resolve(event: React.FormEvent) {
    event.preventDefault();
    const version = ++requestVersion.current;
    setLoading(true);
    setResult(null);
    const response = await resolveIdentity(lookupType === "identifier" ? { identifier: identifier.trim() } : { subject: identifier.trim() });
    if (!IS_DEMO && version !== requestVersion.current) return;
    setResult(response);
    setLoading(false);
  }

  const subject = result?.ok && typeof result.data.subject === "string" ? result.data.subject : null;
  const patient = DEMO_PATIENTS.find((item) => item.id === subject);

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="WORKSPACE / IDENTITY" title="Identity matching" description="Find the home record behind an identifier before requesting access." />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
        <section className="rounded-xl border border-border bg-card p-6 sm:p-7"><h2 className="text-lg font-semibold">Locate a record</h2><p className="mt-2 text-sm text-muted-foreground">Use a registered identifier or the patient&apos;s record ID.</p><form onSubmit={resolve} className="mt-6 space-y-5"><div className="space-y-2"><label htmlFor="lookup-type" className="text-sm font-medium">Look up by</label><select id="lookup-type" value={lookupType} onChange={(event) => { clearResult(); setLookupType(event.target.value as "identifier" | "subject"); setIdentifier(event.target.value === "identifier" ? "urn:ehds:patient:eu-001" : "patient-eu-001"); }} className={selectClass}><option value="identifier">Registered identifier</option><option value="subject">Patient record ID</option></select></div><div className="space-y-2"><label htmlFor="identifier" className="text-sm font-medium">{lookupType === "identifier" ? "Registered identifier" : "Patient record ID"}</label><Input id="identifier" value={identifier} onChange={(event) => { clearResult(); setIdentifier(event.target.value); }} required /></div><Button type="submit" disabled={loading || !identifier.trim()}><Search className="h-4 w-4" aria-hidden />{loading ? "Finding record…" : "Find matching record"}</Button></form><div className="mt-6 border-t border-border pt-5"><p className="mb-2 text-xs text-muted-foreground">Try a synthetic example</p><div className="flex flex-wrap gap-2">{[{ name: "EU example", id: "urn:ehds:patient:eu-001" }, { name: "US example", id: "urn:tefca:patient:us-001" }].map((example) => <Button key={example.id} variant="outline" size="sm" onClick={() => { clearResult(); setLookupType("identifier"); setIdentifier(example.id); }}>{example.name}</Button>)}</div></div></section>
        <aside className="rounded-xl border border-border bg-card p-6"><Fingerprint className="mb-4 h-7 w-7 text-primary" aria-hidden /><h2 className="text-lg font-semibold">Match first. Authorize next.</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">A match locates a record in its home region. It does not grant access to patient information.</p><p className="mt-4 text-sm leading-relaxed text-muted-foreground">Continue to Patient access to check the requesting team&apos;s permissions and the patient&apos;s consent.</p></aside>
      </div>
      <div aria-live="polite" aria-atomic="true">{result?.ok && <section className="rounded-xl border border-primary/25 bg-card p-6"><span className="rounded-full bg-primary-muted px-3 py-1 text-xs font-semibold text-primary">{IS_DEMO ? "Simulated match" : "Record located"}</span><h2 className="mt-4 text-xl font-semibold">{patient?.name ?? "Matching record found"}</h2><dl className="mt-5 grid gap-5 sm:grid-cols-3"><div><dt className="text-xs text-muted-foreground">Record ID</dt><dd className="mt-1 break-all text-sm font-medium">{subject ?? "See response"}</dd></div><div><dt className="text-xs text-muted-foreground">Home region</dt><dd className="mt-1 text-sm font-medium">{typeof result.data.home_jurisdiction === "string" ? result.data.home_jurisdiction : "See response"}</dd></div><div><dt className="text-xs text-muted-foreground">Access</dt><dd className="mt-1 text-sm font-medium">Not yet checked</dd></div></dl>{subject && <Link href={`/patients?patient=${encodeURIComponent(subject)}`} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4">Check patient access<ArrowRight className="h-4 w-4" aria-hidden /></Link>}<ResponseDetails data={result.data} /></section>}{result && !result.ok && <section role="alert" className="rounded-xl border border-warning/40 bg-card p-6"><h2 className="font-semibold">{result.status === 404 ? "No matching record" : "Unable to find a record"}</h2><p className="mt-2 text-sm text-muted-foreground">{result.status === 0 ? "The gateway could not be reached. Check the local backend and try again." : result.error}</p><p className="mt-3 text-sm text-muted-foreground">Check the identifier or try one of the examples above.</p></section>}</div>
    </div>
  );
}
