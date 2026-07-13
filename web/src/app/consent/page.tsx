"use client";

import { useState } from "react";

import { ClinicalStatus } from "@/components/clinical/status";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postConsent } from "@/lib/api";

export default function ConsentPage() {
  const [patientId, setPatientId] = useState("patient-eu-001");
  const [purpose, setPurpose] = useState("research");
  const [adminToken, setAdminToken] = useState("");
  const [granted, setGranted] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await postConsent({
      patient_id: patientId,
      purpose,
      granted,
      admin_token: adminToken,
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
        eyebrow="Admin"
        title="Consent management"
        description="Grant or revoke consent via the gateway admin API (requires CHEX_ADMIN_SECRET bearer). OPAL propagates revocation to the PDP."
      />

      <Card>
        <CardHeader>
          <CardTitle>Consent action</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="consent-patient">Patient ID</Label>
                <Input id="consent-patient" value={patientId} onChange={(e) => setPatientId(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consent-purpose">Purpose</Label>
                <Input id="consent-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="admin-token">Admin bearer token</Label>
                <Input
                  id="admin-token"
                  type="password"
                  autoComplete="off"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                  placeholder="CHEX_ADMIN_SECRET value"
                  required
                />
              </div>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Decision</legend>
              <div className="flex flex-wrap gap-4">
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="radio" name="granted" checked={granted} onChange={() => setGranted(true)} />
                  Grant consent
                </label>
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="radio" name="granted" checked={!granted} onChange={() => setGranted(false)} />
                  Revoke consent
                </label>
              </div>
            </fieldset>
            <Button type="submit" variant={granted ? "default" : "destructive"} disabled={loading}>
              {loading ? "Submitting…" : granted ? "Grant consent" : "Revoke consent"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <div role="alert" className="rounded-lg border-2 border-destructive/40 bg-destructive/10 p-4 text-sm">
          {error}
        </div>
      ) : null}

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Result <ClinicalStatus variant="success">Updated</ClinicalStatus>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">{result}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
