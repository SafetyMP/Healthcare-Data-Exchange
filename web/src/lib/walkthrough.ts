import { IS_DEMO } from "@/lib/demo";

export type WalkthroughAction =
  | { kind: "access"; patientId: string; purpose: string; credential: string; ok: boolean; reason?: string; limited: boolean }
  | { kind: "consent"; patientId: string; purpose: string; credential: string; granted: boolean; ok: boolean };

export const WALKTHROUGH_ACTION_EVENT = "chex-walkthrough-action";
export const WALKTHROUGH_STORAGE_KEY = "chex-walkthrough-v1";
const patientId = "patient-eu-001";

type GuidePurpose = "research" | "treatment" | "derivative";
type GuideRequester = "eu-visiting" | "us-home" | "us-clinician";
export type WalkthroughStage = {
  instruction: string;
  expectation: string;
  href: string;
  route: "/patients" | "/consent";
  action: WalkthroughAction;
};
export type WalkthroughStep = {
  title: string;
  phase: "Consent" | "Regional boundaries" | "Limited sharing" | "Activity";
  introduction: string;
  explanation: string;
  stages: readonly WalkthroughStage[];
};

function href(route: "/patients" | "/consent", purpose: GuidePurpose, credential: GuideRequester) {
  return `${route}?patient=${patientId}&purpose=${purpose}&requester=${credential}`;
}

function access(purpose: GuidePurpose, credential: GuideRequester, ok: boolean, instruction: string, expectation: string, reason?: string, limited = false): WalkthroughStage {
  return { route: "/patients", href: href("/patients", purpose, credential), instruction, expectation, action: { kind: "access", patientId, purpose, credential, ok, reason, limited } };
}

function consent(purpose: GuidePurpose, credential: GuideRequester, granted: boolean, instruction: string): WalkthroughStage {
  return { route: "/consent", href: href("/consent", purpose, credential), instruction, expectation: `Consent updated: ${purpose} ${granted ? "granted" : "revoked"}.`, action: { kind: "consent", patientId, purpose, credential, granted, ok: true } };
}

export const WALKTHROUGH_STEPS: readonly WalkthroughStep[] = [
  {
    title: "See consent protect a record", phase: "Consent",
    introduction: "Anna's research consent starts off. Her treatment consent is a separate preference.",
    explanation: "Research access was blocked because consent was missing. No patient fields were returned.",
    stages: [access("research", "eu-visiting", false, "For Anna Mueller, choose Research and EU visiting care team, then Check access.", "Access blocked because research consent is not granted.", "consent_required")],
  },
  {
    title: "Grant consent and check again", phase: "Consent",
    introduction: "Change the preference, then verify its effect with the same patient, purpose and team.",
    explanation: "The consent grant changed the outcome for the same request. The requester identity and purpose stayed the same.",
    stages: [
      consent("research", "eu-visiting", true, "For Anna's Research preference, choose Grant consent and Save consent."),
      access("research", "eu-visiting", true, "Use Check patient access, keep Research and EU visiting care team, then Check access.", "Access allowed, with the returned fields shown."),
    ],
  },
  {
    title: "Revoke consent and verify the boundary", phase: "Consent",
    introduction: "Consent can change. A previously allowed request must be checked again.",
    explanation: "The next research request was blocked after revocation. An earlier allowed result is not continuing permission.",
    stages: [
      consent("research", "eu-visiting", false, "For Anna's Research preference, choose Revoke consent and Save consent."),
      access("research", "eu-visiting", false, "Return to Patient access with Research and EU visiting care team, then Check access.", "Access blocked because research consent has been revoked.", "consent_required"),
    ],
  },
  {
    title: "Keep treatment separate from research", phase: "Consent",
    introduction: "Research and treatment use separate consent preferences. Check treatment on its own.",
    explanation: "Treatment access was allowed. Each purpose has its own consent preference; a research decision does not grant or revoke treatment.",
    stages: [access("treatment", "eu-visiting", true, "For Anna, choose Treatment and EU visiting care team, then Check access.", "Access allowed for treatment.")],
  },
  {
    title: "Try the same record from another region", phase: "Regional boundaries",
    introduction: "Keep Anna and Treatment, but change the requester to the US home care team.",
    explanation: "Granted treatment consent did not permit this regional transfer. Requester identity is part of the decision.",
    stages: [access("treatment", "us-home", false, "For Anna, choose Treatment and US home care team, then Check access.", "Access blocked by the regional sharing rule.", "residency_denied")],
  },
  {
    title: "Confirm consent cannot override region", phase: "Regional boundaries",
    introduction: "Treatment consent is already granted. Save that preference to confirm it cannot override the regional restriction.",
    explanation: "The recheck still used the US home team and remained blocked after saving consent. Consent cannot bypass regional restrictions.",
    stages: [
      consent("treatment", "us-home", true, "Keep Anna's Treatment preference and US home requester. Choose Grant consent and Save consent."),
      access("treatment", "us-home", false, "Use Check patient access. Confirm US home care team is preserved, then Check access.", "Access remains blocked by the regional sharing rule.", "residency_denied"),
    ],
  },
  {
    title: "A limited purpose alone is not enough", phase: "Limited sharing",
    introduction: "A limited derivative still requires a requester permitted to use that exception.",
    explanation: "The US home requester could not use the derivative exception. Changing the purpose alone did not grant access.",
    stages: [access("derivative", "us-home", false, "For Anna, choose Limited derivative and US home care team, then Check access.", "Access blocked; this team has no cross-region derivative permission.", "residency_denied")],
  },
  {
    title: "Inspect an explicitly limited response", phase: "Limited sharing",
    introduction: "Use the special US care-team preset with the limited derivative permission.",
    explanation: "The permitted cross-region derivative returned a limited response. Name and date of birth were withheld.",
    stages: [access("derivative", "us-clinician", true, "Keep Limited derivative. Choose US care team · limited cross-region access, then Check access.", "Limited access allowed, without identifying clinical fields.", undefined, true)],
  },
  {
    title: "Review the decision trail", phase: "Activity",
    introduction: "Open Activity and compare the requests, consent changes and outcomes from this walkthrough.",
    explanation: "The trail records this tab's simulated actions. It is not a production audit log or evidence that a live policy service ran.",
    stages: [],
  },
];

export type WalkthroughState = { version: 1; index: number; progress: number; paused: boolean; finished: boolean };
export function initialWalkthroughState(): WalkthroughState {
  return { version: 1, index: 0, progress: 0, paused: false, finished: false };
}

export function isWalkthroughAction(value: unknown): value is WalkthroughAction {
  if (typeof value !== "object" || value === null) return false;
  const action = value as Record<string, unknown>;
  if (typeof action.patientId !== "string" || typeof action.purpose !== "string" || typeof action.credential !== "string" || typeof action.ok !== "boolean") return false;
  if (action.kind === "access") return typeof action.limited === "boolean" && (action.reason === undefined || typeof action.reason === "string");
  return action.kind === "consent" && typeof action.granted === "boolean";
}

/** Called after a real UI operation returns. This function never makes a request. */
export function reportWalkthroughAction(action: WalkthroughAction) {
  if (!IS_DEMO || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<WalkthroughAction>(WALKTHROUGH_ACTION_EVENT, { detail: action }));
}

export function matchesWalkthroughAction(expected: WalkthroughAction, action: WalkthroughAction): boolean {
  if (expected.kind !== action.kind || expected.patientId !== action.patientId || expected.purpose !== action.purpose || expected.credential !== action.credential || expected.ok !== action.ok) return false;
  if (expected.kind === "consent" && action.kind === "consent") return expected.granted === action.granted;
  return expected.kind === "access" && action.kind === "access" && expected.reason === action.reason && expected.limited === action.limited;
}

export function applyWalkthroughAction(state: WalkthroughState, action: WalkthroughAction): WalkthroughState {
  if (state.paused || state.finished) return state;
  const expected = WALKTHROUGH_STEPS[state.index]?.stages[state.progress]?.action;
  return expected && matchesWalkthroughAction(expected, action) ? { ...state, progress: state.progress + 1 } : state;
}

export function restoreWalkthroughState(value: unknown): WalkthroughState | null {
  if (typeof value !== "object" || value === null) return null;
  const saved = value as Record<string, unknown>;
  if (saved.version !== 1 || typeof saved.index !== "number" || !Number.isInteger(saved.index) || saved.index < 0 || saved.index >= WALKTHROUGH_STEPS.length || typeof saved.progress !== "number" || !Number.isInteger(saved.progress) || saved.progress < 0 || typeof saved.paused !== "boolean" || typeof saved.finished !== "boolean") return null;
  const step = WALKTHROUGH_STEPS[saved.index];
  if (!step || saved.progress > step.stages.length || (saved.finished && saved.index !== WALKTHROUGH_STEPS.length - 1)) return null;
  return { version: 1, index: saved.index, progress: saved.progress, paused: saved.paused, finished: saved.finished };
}
