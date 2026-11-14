"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ArrowUpRight, ArrowRightLeft, BookOpen, ChevronDown, Fingerprint, FlaskConical, LayoutDashboard, Menu, RotateCcw, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { useState } from "react";
import { resetSelectedPatient } from "@/components/clinical/patient-selector";
import { type NavItem } from "@/lib/navigation";
import { IS_DEMO, resetDemo } from "@/lib/demo";

const icons = [LayoutDashboard, Users, ShieldCheck, Fingerprint, Activity, Sparkles];
type Props = { productName: string; eyebrow: string; nav: NavItem[]; children: React.ReactNode };

export function AppShell({ nav, children }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState("");
  function reset() {
    resetSelectedPatient();
    resetDemo();
    setNotice("Demo reset. Original patients and consent restored.");
  }
  return (
    <div className="exchange-app">
      <aside className="desktop-sidebar">
        <Link href="/" className="brand" aria-label="Healthcare Data Exchange home"><span className="brand-mark"><ArrowRightLeft size={21} /></span><span>healthcare<span className="brand-sub">DATA EXCHANGE</span></span></Link>
        <div className="workspace-label"><span className="workspace-icon">S</span><span>Sandbox workspace<small>Synthetic patient data</small></span><ChevronDown size={14} aria-hidden /></div>
        <p className="nav-caption">WORKSPACE</p>
        <nav aria-label="Primary" className="side-nav">{nav.map((item, index) => {
          const Icon = icons[index] || Activity;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}><Icon size={18} aria-hidden /><span>{item.label}</span>{item.href === "/patients" && <span className="nav-count">4</span>}</Link>;
        })}</nav>
        <div className="sidebar-bottom"><div className="sidebar-note"><ShieldCheck size={22} /><h2>Purpose before access.</h2><p>Explore how consent and regional boundaries shape data sharing.</p><a href="https://github.com/SafetyMP/Healthcare-Data-Exchange#what-the-demo-is-designed-to-prove" target="_blank" rel="noreferrer">Explore the project <ArrowUpRight size={14} /></a></div><a className="source-link" href="https://github.com/SafetyMP/Healthcare-Data-Exchange" target="_blank" rel="noreferrer"><BookOpen size={17} /> Documentation <ArrowUpRight size={14} /></a><div className="profile"><span>DW</span><div>Demo workspace<small>{IS_DEMO ? "Local simulation" : "Live gateway mode"}</small></div></div></div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar"><div className="topbar-location"><button className="mobile-menu icon-button" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} aria-controls="mobile-nav" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{nav.find((item) => item.href === pathname || (item.href !== "/" && pathname.startsWith(item.href)))?.label || "Overview"}</strong></div><div className="topbar-actions"><span className="mode-badge"><span />{IS_DEMO ? "Interactive demo" : "Live gateway"}</span>{IS_DEMO && <button className="reset-button" onClick={reset}><RotateCcw size={14} />Reset demo</button>}<span className="avatar-small" aria-hidden>DW</span></div></header>
        {mobileOpen && <nav id="mobile-nav" aria-label="Mobile" className="mobile-navigation">{nav.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>{item.label}</Link>)}</nav>}
        <div className="demo-strip"><FlaskConical size={14} aria-hidden /><span>{IS_DEMO ? "A safe place to explore. All patients and access decisions are simulated." : "Synthetic records only. Requests use the configured gateway and its authorization policy."}</span><span className="demo-strip-tag">NO REAL PATIENT DATA</span></div>
        {notice && <div role="status" className="reset-notice">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={16} /></button></div>}
        <main id="main-content" tabIndex={-1} className="workspace-content">{children}</main>
        <footer className="workspace-footer"><span>Healthcare Data Exchange <span aria-hidden>·</span> An open-source exploration</span><span>Synthetic data. Real questions about access.</span></footer>
      </div>
    </div>
  );
}
