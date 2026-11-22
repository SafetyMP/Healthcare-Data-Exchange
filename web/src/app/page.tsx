"use client";

import { CasePage, GatewayReference } from "@/components/clinical/pilot-case";
import { IS_DEMO } from "@/lib/demo";

export default function DashboardPage() {
  return IS_DEMO ? <CasePage /> : <GatewayReference />;
}
