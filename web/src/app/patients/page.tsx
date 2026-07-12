"use client";

import { useState } from "react";

import { ClinicalStatus } from "@/components/clinical/status";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPatient } from "@/lib/api";

export default function PatientsPage() {
  const [patientId, setPatientId] = useState("patient-eu-001");
  const [purpose, setPurpose] = useState("treatment");
  const [jurisdiction, setJurisdiction] = useState("eu-visiting");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await getPatient(patientId, { purpose, requester_jurisdiction: jurisdiction });
    setLoading(false);
    if (!res.ok) {
      setError(`${res.status}: ${res.error}`);
      setResult(res.body ? JSON.stringify(res.body, null, 2) : null);
      return;
    }
    setResult(JSON.stringify(res.data, null, 2));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="FHIR"
        title="Patient lookup"
        description="Gateway PEP enforces OPA policy before returning synthetic Patient resources."
      />

      <Card>
        <CardHeader>
          <CardTitle>Query parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="patient-id">Patient ID</Label>
                <Input id="patient-id" value={patientId} onChange={(e) => setPatientId(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Input id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="jurisdiction">Requester jurisdiction</Label>
                <Input
                  id="jurisdiction"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Loading…" : "Fetch patient"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <div role="alert" className="rounded-lg border-2 border-destructive/40 bg-destructive/10 p-4">
          <ClinicalStatus variant="critical">Request denied or failed</ClinicalStatus>
          <p className="mt-2 text-sm text-foreground">{error}</p>
        </div>
      ) : null}

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">{result}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
