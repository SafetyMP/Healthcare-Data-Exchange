"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, ArrowRight, CheckCircle2, CircleX, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DEMO_EVENT, getDemoActivity, IS_DEMO } from "@/lib/demo";

export default function ActivityPage() {
  const [events, setEvents] = useState<ReturnType<typeof getDemoActivity>>([]);
  useEffect(() => { const update = () => setEvents(getDemoActivity()); update(); window.addEventListener(DEMO_EVENT, update); return () => window.removeEventListener(DEMO_EVENT, update); }, []);
  return <div className="flex flex-col gap-7"><PageHeader eyebrow="YOUR SESSION" title="Activity" description={IS_DEMO ? "Follow the decisions and consent changes you have explored in this browser tab." : "The live gateway does not expose an activity feed in this console."} /><div className="surface"><div className="surface-heading"><div><h2>{IS_DEMO ? "Simulated decision history" : "Session history"}</h2><p>{IS_DEMO ? "Local to this demo. Cleared when you reset or close the tab." : "Use backend audit records to inspect live requests."}</p></div><Activity size={21} /></div>{events.length && IS_DEMO ? <ol className="activity-list">{events.map((event) => <li key={event.id}><span className={`activity-icon ${event.outcome}`}>{event.outcome === "allowed" ? <CheckCircle2 size={18} /> : event.outcome === "blocked" ? <CircleX size={18} /> : <RefreshCw size={18} />}</span><div><strong>{event.title}</strong><p>{event.detail}</p></div><time dateTime={event.time}>{new Date(event.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></li>)}</ol> : <div className="empty-activity"><span><Activity size={30} /></span><h2>{IS_DEMO ? "Your first decision starts here" : "Live history is not connected"}</h2><p>{IS_DEMO ? "Check a patient’s access or change consent to see a clear trail of what happened." : "Patient access remains available through the configured gateway."}</p><Link href="/patients" className="primary-link">Explore patients <ArrowRight size={16} /></Link></div>}</div></div>;
}
