"use client";

import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveIdentity } from "@/lib/api";

export default function IdentityPage() {
  const [system, setSystem] = useState("urn:oid:2.16.840.1.113883.4.1");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await resolveIdentity({ system, value });
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
        eyebrow="Identity broker"
        title="Identifier resolve"
        description="ITI-78-style resolve stub for cross-border identifier mapping demos."
      />

      <Card>
        <CardHeader>
          <CardTitle>Resolve request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="id-system">Identifier system</Label>
              <Input id="id-system" value={system} onChange={(e) => setSystem(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="id-value">Identifier value</Label>
              <Input id="id-value" value={value} onChange={(e) => setValue(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Resolving…" : "Resolve identifier"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? <div role="alert" className="rounded-lg border-2 border-destructive/40 bg-destructive/10 p-4 text-sm">{error}</div> : null}

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>Resolution result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">{result}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
