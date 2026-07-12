import Link from "next/link";
import { Activity, Brain, FileSearch, Shield, Users } from "lucide-react";

import { ReferenceBanner, ClinicalStatus } from "@/components/clinical/status";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const workflows = [
  {
    href: "/patients",
    title: "Patient lookup",
    description: "Policy-gated FHIR read via the gateway PEP.",
    icon: Users,
  },
  {
    href: "/consent",
    title: "Consent admin",
    description: "Grant or revoke research consent for demo tenants.",
    icon: Shield,
  },
  {
    href: "/ai-triage",
    title: "AI triage stub",
    description: "Exercise Art. 50 transparency and human-oversight hooks.",
    icon: Brain,
  },
  {
    href: "/identity",
    title: "Identity resolve",
    description: "ITI-78-style identifier resolution through the broker.",
    icon: FileSearch,
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Clinician console"
        title="Cloud Healthcare Exchange"
        description="Reference-slice UI for jurisdiction-aware FHIR access, consent, identity, and AI governance demos. Synthetic data only."
      />

      <ReferenceBanner title="Reference implementation only">
        This console is for design authority and walking-skeleton demos. It is not certified, not an ATO, and must not be used with real PHI.
      </ReferenceBanner>

      <div className="flex flex-wrap gap-2">
        <ClinicalStatus variant="neutral">EU + US cells</ClinicalStatus>
        <ClinicalStatus variant="success">OPA policy-as-code</ClinicalStatus>
        <ClinicalStatus variant="warning">Demo credentials</ClinicalStatus>
      </div>

      <section aria-labelledby="workflows-heading" className="grid gap-4 sm:grid-cols-2">
        <h2 id="workflows-heading" className="sr-only">
          Workflows
        </h2>
        {workflows.map((item) => (
          <Link key={item.href} href={item.href} className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-accent/20">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription className="mt-2">{item.description}</CardDescription>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" aria-hidden />
                  </span>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" aria-hidden />
            Backend integration
          </CardTitle>
          <CardDescription>
            Start the stack with <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">./scripts/run-dev.sh</code> from the repo root, then use this UI on port 3100. API calls proxy through <code className="font-mono text-xs">/api</code> to the gateway.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Hermetic verify remains <code className="font-mono text-xs">./scripts/verify.sh</code>. Full E2E proof is still <code className="font-mono text-xs">./scripts/demo.sh</code>.
        </CardContent>
      </Card>
    </div>
  );
}
