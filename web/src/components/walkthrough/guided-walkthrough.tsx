"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Compass, Pause, Play, RotateCcw } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { resetSelectedPatient } from "@/components/clinical/patient-selector";
import { resetAccessContext } from "@/components/clinical/use-access-context";
import { Button } from "@/components/ui/button";
import { DEMO_RESET_EVENT, IS_DEMO, resetDemo } from "@/lib/demo";
import { applyWalkthroughAction, initialWalkthroughState, isWalkthroughAction, matchesWalkthroughAction, restoreWalkthroughState, WALKTHROUGH_ACTION_EVENT, WALKTHROUGH_STEPS, WALKTHROUGH_STORAGE_KEY, type WalkthroughAction, type WalkthroughState } from "@/lib/walkthrough";

type FocusRequest = { route: string; nonce: number };
type GuideContextValue = {
  state: WalkthroughState | null;
  ready: boolean;
  storageAvailable: boolean;
  focusRequest: FocusRequest | null;
  clearFocus: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  finish: () => void;
};
const GuideContext = createContext<GuideContextValue | null>(null);

function currentRoute(pathname: string): string {
  const path = pathname.replace(/\/$/, "");
  return ["/patients", "/consent", "/activity", "/identity", "/ai-triage"].find((route) => path.endsWith(route)) ?? "/";
}

function stepHref(state: WalkthroughState): string {
  const step = WALKTHROUGH_STEPS[state.index];
  if (!step || step.stages.length === 0) return "/activity";
  return step.stages[Math.min(state.progress, step.stages.length - 1)]?.href ?? "/patients";
}

function stepComplete(state: WalkthroughState): boolean {
  const step = WALKTHROUGH_STEPS[state.index];
  return Boolean(step && step.stages.length > 0 && state.progress === step.stages.length);
}

export function GuidedWalkthroughProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<WalkthroughState | null>(null);
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const focusNonce = useRef(0);

  useEffect(() => {
    if (!IS_DEMO) return;
    const load = () => {
      try {
        const raw = window.sessionStorage.getItem(WALKTHROUGH_STORAGE_KEY);
        try {
          setState(raw ? restoreWalkthroughState(JSON.parse(raw)) : null);
        } catch {
          // A corrupt saved checkpoint is discarded; it is not a storage outage.
          setState(null);
        }
      } catch {
        setStorageAvailable(false);
      }
      setReady(true);
    };
    load();
    const onAction = (event: Event) => {
      if (!(event instanceof CustomEvent) || !isWalkthroughAction(event.detail)) return;
      const action = event.detail;
      setState((current) => current ? applyWalkthroughAction(current, action) : current);
    };
    const onReset = () => { setState(null); setFocusRequest(null); };
    window.addEventListener(WALKTHROUGH_ACTION_EVENT, onAction);
    window.addEventListener(DEMO_RESET_EVENT, onReset);
    return () => {
      window.removeEventListener(WALKTHROUGH_ACTION_EVENT, onAction);
      window.removeEventListener(DEMO_RESET_EVENT, onReset);
    };
  }, []);

  useEffect(() => {
    if (!IS_DEMO || !ready) return;
    const save = () => {
      try {
        if (state) window.sessionStorage.setItem(WALKTHROUGH_STORAGE_KEY, JSON.stringify(state));
        else window.sessionStorage.removeItem(WALKTHROUGH_STORAGE_KEY);
      } catch {
        setStorageAvailable(false);
      }
    };
    save();
  }, [state, ready]);

  const navigateToStep = (nextState: WalkthroughState) => {
    const href = stepHref(nextState);
    focusNonce.current += 1;
    setFocusRequest({ route: href.split("?")[0] ?? "/patients", nonce: focusNonce.current });
    router.push(href);
  };

  const start = () => {
    if (!IS_DEMO || !ready) return;
    // The adjacent start/restart disclosure makes this deliberate tab-local reset explicit.
    resetSelectedPatient();
    resetAccessContext();
    resetDemo();
    const nextState = initialWalkthroughState();
    setState(nextState);
    navigateToStep(nextState);
  };
  const pause = () => setState((current) => current ? { ...current, paused: true } : current);
  const resume = () => {
    if (!state || state.finished) return;
    const nextState = { ...state, paused: false };
    setState(nextState);
    navigateToStep(nextState);
  };
  const next = () => {
    if (!state || state.paused || state.finished || !stepComplete(state) || state.index >= WALKTHROUGH_STEPS.length - 1) return;
    const nextState = { ...state, index: state.index + 1, progress: 0 };
    setState(nextState);
    navigateToStep(nextState);
  };
  const finish = () => {
    if (!state || state.paused || state.index !== WALKTHROUGH_STEPS.length - 1 || currentRoute(pathname) !== "/activity") return;
    setState({ ...state, finished: true });
    focusNonce.current += 1;
    setFocusRequest({ route: "/activity", nonce: focusNonce.current });
  };
  const clearFocus = useCallback(() => setFocusRequest(null), []);

  return <GuideContext.Provider value={{ state, ready, storageAvailable, focusRequest, clearFocus, start, pause, resume, next, finish }}>{children}</GuideContext.Provider>;
}

export function useWalkthrough() {
  return useContext(GuideContext);
}

export function WalkthroughLauncher({ className }: { className?: string }) {
  const guide = useWalkthrough();
  if (!IS_DEMO || !guide) return null;
  const resumable = guide.state && !guide.state.finished;
  return (
    <div className="walkthrough-launcher">
      <Button onClick={resumable ? guide.resume : guide.start} disabled={!guide.ready} className={className}>
        <Compass className="h-4 w-4" aria-hidden />{resumable ? "Resume walkthrough" : guide.state?.finished ? "Restart walkthrough" : "Start guided walkthrough"}
      </Button>
      <p className="mt-2 max-w-lg text-xs leading-relaxed text-muted-foreground">{resumable ? "Continue your saved checkpoint. Resuming does not reset consent or activity." : "Nine checkpoints, using synthetic data. Starting or restarting resets this tab’s demo consent and activity."}</p>
    </div>
  );
}

export function WalkthroughPanel() {
  const guide = useWalkthrough();
  const pathname = usePathname();
  const heading = useRef<HTMLHeadingElement>(null);
  const route = currentRoute(pathname);

  useEffect(() => {
    if (!guide?.focusRequest || guide.focusRequest.route !== route || !heading.current) return;
    heading.current.focus({ preventScroll: true });
    heading.current.scrollIntoView({ block: "nearest", behavior: "instant" });
    guide.clearFocus();
  }, [guide, route]);

  if (!IS_DEMO || !guide || !guide.ready) return null;
  const state = guide.state;
  if (!state) {
    if (route === "/") return null;
    return <section aria-label="Guided walkthrough" className="walkthrough-panel mb-6 rounded-xl border border-primary/20 bg-card p-5"><div className="mb-3 flex items-center gap-2"><Compass className="h-5 w-5 text-primary" aria-hidden /><h2 className="font-semibold">Explore with a guided walkthrough</h2></div><p className="mb-4 text-sm text-muted-foreground">Try consent, regional boundaries and limited sharing with clear checkpoints.</p><WalkthroughLauncher /></section>;
  }
  const step = WALKTHROUGH_STEPS[state.index];
  if (!step) return null;
  const completed = stepComplete(state);
  const finalStep = state.index === WALKTHROUGH_STEPS.length - 1;
  const stage = step.stages[Math.min(state.progress, step.stages.length - 1)];
  const rightRoute = route === (stage?.route ?? "/activity");
  const controlsId = stage?.route === "/consent" ? "consent-purpose" : "purpose";

  return (
    <section aria-label="Guided walkthrough" className="walkthrough-panel mb-6 rounded-xl border border-primary/25 bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary"><Compass className="h-4 w-4" aria-hidden />Guided walkthrough <span className="text-muted-foreground">· {step.phase}</span></p>
        <span className="text-xs font-medium text-muted-foreground">Step {state.index + 1} of {WALKTHROUGH_STEPS.length}</span>
      </div>
      <progress aria-label="Walkthrough progress" max={WALKTHROUGH_STEPS.length} value={state.finished ? WALKTHROUGH_STEPS.length : state.index + (completed ? 1 : 0)} className="mt-4 h-1.5 w-full accent-primary" />
      <h2 ref={heading} tabIndex={-1} className="mt-4 text-lg font-semibold tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">{state.finished ? "Walkthrough complete" : state.paused ? "Walkthrough paused" : step.title}</h2>

      {state.finished ? <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground"><p>You completed all nine checkpoints: purpose-specific consent, regional restrictions, the limited derivative exception and the decision trail.</p><p>These were browser-local simulations, not live policy-service or clinical validation. Explore freely, or restart to repeat the same starting scenario.</p></div> : state.paused ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Your place is saved at “{step.title}”. Actions while paused do not complete guide checkpoints. Consent and activity stay as they are.</p> : <>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.introduction}</p>
        {completed ? <div className="mt-4 rounded-lg bg-primary-muted p-4"><p role="status" className="flex items-center gap-2 text-sm font-semibold text-primary"><CheckCircle2 className="h-4 w-4" aria-hidden />Step complete</p><p className="mt-2 text-sm leading-relaxed">{step.explanation}</p></div> : <div className="mt-4 grid gap-4 rounded-lg bg-background p-4 md:grid-cols-[1.4fr_1fr]">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{step.stages.length > 1 ? `Action ${state.progress + 1} of ${step.stages.length}` : "Do this"}</p><p className="mt-1 text-sm leading-relaxed">{stage?.instruction ?? "Review Activity below, then choose Finish walkthrough."}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expected result</p><p className="mt-1 text-sm leading-relaxed">{stage?.expectation ?? "A trail of the consent changes, requester contexts and access decisions you just observed."}</p></div>
        </div>}
        {finalStep && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.explanation}</p>}
        {!completed && !finalStep && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Follow the instruction above, then check the result. Exploring another scenario? Return to this step restores its selections without changing consent.</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {!completed && !finalStep && (rightRoute ? <Button variant="outline" size="sm" onClick={() => { const control = document.getElementById(controlsId); control?.focus(); control?.scrollIntoView({ block: "center", behavior: "instant" }); }}>Show the controls</Button> : <Link href={stepHref(state)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">{stage?.route === "/consent" ? "Go to consent" : "Go to patient access"}<ArrowRight className="h-4 w-4" aria-hidden /></Link>)}
          <Link href={stepHref(state)} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4">Return to this step</Link>
          {finalStep ? <Button onClick={guide.finish} disabled={!rightRoute}>Finish walkthrough<CheckCircle2 className="h-4 w-4" aria-hidden /></Button> : <Button onClick={guide.next} disabled={!completed}>Next step<ArrowRight className="h-4 w-4" aria-hidden /></Button>}
        </div>
      </>}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        {!state.finished && <Button variant="ghost" size="sm" onClick={state.paused ? guide.resume : guide.pause}>{state.paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}{state.paused ? "Resume walkthrough" : "Pause walkthrough"}</Button>}
        <Button variant="ghost" size="sm" onClick={guide.start}><RotateCcw className="h-4 w-4" aria-hidden />Restart walkthrough</Button>
        <p className="text-xs leading-relaxed text-muted-foreground">Restart resets this tab’s demo consent and activity.</p>
      </div>
      {!guide.storageAvailable && <p role="status" className="mt-3 text-xs text-muted-foreground">Browser storage is unavailable. Progress is kept only while this page stays open.</p>}
    </section>
  );
}

/** A nearby continuation after a form result, especially useful on small screens. */
export function WalkthroughCheckpoint({ action }: { action: WalkthroughAction }) {
  const guide = useWalkthrough();
  if (!IS_DEMO || !guide?.state || guide.state.paused || guide.state.finished || !stepComplete(guide.state)) return null;
  const step = WALKTHROUGH_STEPS[guide.state.index];
  const expected = step?.stages[step.stages.length - 1]?.action;
  if (!step || !expected || !matchesWalkthroughAction(expected, action)) return null;
  return <section aria-label="Walkthrough checkpoint" className="walkthrough-checkpoint mt-4 rounded-xl border border-primary/25 bg-primary-muted p-4"><p className="flex items-center gap-2 text-sm font-semibold text-primary"><CheckCircle2 className="h-4 w-4" aria-hidden />Checkpoint complete</p><p className="mt-2 text-sm leading-relaxed">{step.explanation}</p><Button onClick={guide.next} className="mt-3">Next step<ArrowRight className="h-4 w-4" aria-hidden /></Button></section>;
}
