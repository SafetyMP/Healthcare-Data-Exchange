"use client";

import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postAiTriage } from "@/lib/api";

export default function AiTriagePage() {
  const [patientId, setPatientId] = useState("patient-eu-001");
  const [symptoms, setSymptoms] = useState("chest pain, dyspnea");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await postAiTriage({
      patient_id: patientId,
      symptoms: symptoms.split(",").map((s) => s.trim()).filter(Boolean),
      requester_jurisdiction: "eu-visiting",
    });
    setLoading(false);
    if (!res.ok) {
      setError(`${res.status}: ${res.error}`);
      return;
    }
    setResult(JSON.stringify(res.data, null, 2));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="AI governance"
        title="AI triage stub"
        description="Demonstrates triage output with Art. 50 transparency flags and human-oversight workflow hooks."
      />

      <Card>
        <CardHeader>
          <CardTitle>Triage request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="triage-patient">Patient ID</Label>
              <Input id="triage-patient" value={patientId} onChange={(e) => setPatientId(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symptoms">Symptoms (comma-separated)</Label>
              <Input id="symptoms" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Running triage…" : "Run AI triage"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? <div role="alert" className="rounded-lg border-2 border-destructive/40 bg-destructive/10 p-4 text-sm">{error}</div> : null}

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>Triage response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">{result}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
