import type { ApiResult, CredentialProfile } from "@/lib/api";

/** A compile-time mode: the published demo never connects to the gateway. */
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
export const DEMO_EVENT = "chex-demo-change";
export const DEMO_RESET_EVENT = "chex-demo-reset";

export type DemoPurpose = "treatment" | "research" | "derivative";
export type DemoPatient = {
  id: string;
  name: string;
  initials: string;
  region: "EU" | "US";
  identifier: string;
  system: string;
  birthDate: string;
  organization: string;
  gender: "female" | "male";
};

// Patient fields come from fhir/samples/{eu,us}; organization labels are fictional.
export const DEMO_PATIENTS: readonly DemoPatient[] = [
  { id: "patient-eu-001", name: "Anna Mueller", initials: "AM", region: "EU", identifier: "EU-001-TEST", system: "urn:chex:eu:national-id", birthDate: "1985-03-12", organization: "European demo cell", gender: "female" },
  { id: "patient-eu-002", name: "Jean Dupont", initials: "JD", region: "EU", identifier: "EU-002-TEST", system: "urn:chex:eu:national-id", birthDate: "1972-11-08", organization: "European demo cell", gender: "male" },
  { id: "patient-us-001", name: "Maria Johnson", initials: "MJ", region: "US", identifier: "US-001-TEST", system: "urn:chex:us:mrn", birthDate: "1990-07-22", organization: "US demo cell", gender: "female" },
  { id: "patient-us-002", name: "James Williams", initials: "JW", region: "US", identifier: "US-002-TEST", system: "urn:chex:us:mrn", birthDate: "1978-04-15", organization: "US demo cell", gender: "male" },
];

export type DemoActivity = {
  id: string;
  title: string;
  detail: string;
  time: string;
  outcome: "allowed" | "blocked" | "updated";
};

type DemoState = {
  version: 1;
  consent: Record<string, Record<DemoPurpose, boolean>>;
  activity: DemoActivity[];
  sequence: number;
};

const STORAGE_KEY = "chex-synthetic-demo-v1";
const PURPOSES: readonly DemoPurpose[] = ["treatment", "research", "derivative"];
let memoryState: DemoState | undefined;

function initialState(): DemoState {
  return {
    version: 1,
    // Matches services/consent-service/chex_consent/main.py, not live OPAL state.
    consent: Object.fromEntries(DEMO_PATIENTS.map((patient) => [patient.id, {
      treatment: true,
      research: patient.id.endsWith("002"),
      derivative: true,
    }])),
    activity: [],
    sequence: 0,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isActivity(value: unknown): value is DemoActivity {
  return isObject(value) && typeof value.id === "string" &&
    typeof value.title === "string" && typeof value.detail === "string" &&
    typeof value.time === "string" && Number.isFinite(Date.parse(value.time)) &&
    (value.outcome === "allowed" || value.outcome === "blocked" || value.outcome === "updated");
}

function restoreState(value: unknown): DemoState | undefined {
  if (!isObject(value) || value.version !== 1 || !isObject(value.consent) ||
    !Array.isArray(value.activity) || !value.activity.every(isActivity) ||
    typeof value.sequence !== "number" || !Number.isSafeInteger(value.sequence) || value.sequence < 0) return;
  const state = initialState();
  for (const patient of DEMO_PATIENTS) {
    const flags = value.consent[patient.id];
    if (!isObject(flags) || PURPOSES.some((purpose) => typeof flags[purpose] !== "boolean")) return;
    state.consent[patient.id] = {
      treatment: flags.treatment === true,
      research: flags.research === true,
      derivative: flags.derivative === true,
    };
  }
  state.activity = value.activity.slice(0, 30);
  state.sequence = value.sequence;
  return state;
}

function readState(): DemoState {
  if (!IS_DEMO || typeof window === "undefined") return initialState();
  if (memoryState) return memoryState;
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    memoryState = stored ? restoreState(JSON.parse(stored)) : undefined;
  } catch {
    // Storage may be disabled. The demo still works in memory for this page.
  }
  memoryState ??= initialState();
  return memoryState;
}

function writeState(state: DemoState) {
  if (!IS_DEMO || typeof window === "undefined") return;
  memoryState = state;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // No persistence promise when browser storage is unavailable.
  }
  window.dispatchEvent(new Event(DEMO_EVENT));
}

function record(title: string, detail: string, outcome: DemoActivity["outcome"]) {
  const state = readState();
  state.sequence += 1;
  state.activity = [{ id: `demo-${state.sequence}`, title, detail, outcome, time: new Date().toISOString() }, ...state.activity].slice(0, 30);
  writeState(state);
}

export function getDemoActivity(): DemoActivity[] {
  return readState().activity.map((entry) => ({ ...entry }));
}

export function getDemoConsent(patientId: string, purpose: string): boolean {
  if (!isPurpose(purpose)) return false;
  return readState().consent[patientId]?.[purpose] === true;
}

export function resetDemo() {
  writeState(initialState());
  if (IS_DEMO && typeof window !== "undefined") window.dispatchEvent(new Event(DEMO_RESET_EVENT));
}

function isPurpose(purpose: string): purpose is DemoPurpose {
  return purpose === "treatment" || purpose === "research" || purpose === "derivative";
}

function failure(status: number, reason: string, message: string): ApiResult<Record<string, unknown>> {
  return { ok: false, status, error: message, body: { error: status === 403 ? "policy_denied" : "request_failed", reason, message, simulated: true } };
}

/** Illustrates policy/authz.rego for these fixtures only. This is not an authorization engine. */
export function simulatePatient(id: string, purpose: string, credential: CredentialProfile | undefined): ApiResult<Record<string, unknown>> {
  const patient = DEMO_PATIENTS.find((entry) => entry.id === id);
  if (!credential) return failure(401, "invalid_credential", "Choose a recognized demo caller profile.");
  if (!patient) return failure(404, "patient_not_found", "This patient is not in the synthetic demo. Choose one of the sample patients.");
  if (!isPurpose(purpose)) return failure(400, "invalid_purpose", "Choose treatment, research, or derivative use.");
  if (!getDemoConsent(id, purpose)) {
    record("Access blocked", `${patient.name} · ${purpose} consent is not granted`, "blocked");
    return failure(403, "consent_required", `Consent for ${purpose} is not granted. Review this patient's consent, then check access again.`);
  }
  const requesterRegion = credential.startsWith("eu-") ? "EU" : "US";
  const crossBloc = requesterRegion !== patient.region;
  const derivativeException = crossBloc && credential === "us-clinician" && purpose === "derivative";
  if (crossBloc && !derivativeException) {
    record("Access blocked", `${patient.name} · cross-region ${purpose} request`, "blocked");
    return failure(403, "residency_denied", "The caller and patient are in different regions. Consent alone does not permit this transfer. Use a caller in the patient's region; the limited derivative example requires the US clinician profile.");
  }
  const [given, ...family] = patient.name.split(" ");
  const resource = derivativeException ? { id: patient.id, resourceType: "Patient" } : {
    id: patient.id,
    resourceType: "Patient",
    name: [{ given: [given], family: family.join(" ") }],
    birthDate: patient.birthDate,
    gender: patient.gender,
  };
  record(derivativeException ? "Limited access allowed" : "Access allowed", `${patient.name} · ${purpose} · ${derivativeException ? "identifier only" : "minimum-necessary fields"}`, "allowed");
  return { ok: true, status: 200, data: {
    patient: resource,
    subject: patient.id,
    home_jurisdiction: patient.region === "EU" ? "eu-home" : "us-home",
    home_cell: patient.region.toLowerCase(),
    requester_jurisdiction: credential,
    cross_bloc: crossBloc,
    tefca_xp: patient.region === "US" ? (purpose === "treatment" ? "T-TREAT" : purpose === "derivative" ? "T-HCO" : "") : "",
    min_necessary_fields: Object.keys(resource),
    exception_label: derivativeException ? "cross_bloc_derivative" : "",
    simulated: true,
  } };
}

export function simulateConsent(patientId: string, purpose: string, granted: boolean): ApiResult<Record<string, unknown>> {
  const patient = DEMO_PATIENTS.find((entry) => entry.id === patientId);
  if (!patient) return failure(404, "patient_not_found", "Choose a patient from the synthetic demo.");
  if (!isPurpose(purpose)) return failure(400, "invalid_purpose", "Choose treatment, research, or derivative use.");
  const state = readState();
  const flags = state.consent[patientId];
  if (!flags) return failure(404, "patient_not_found", "No consent record exists for this patient.");
  flags[purpose] = granted;
  writeState(state);
  record(granted ? "Consent granted" : "Consent revoked", `${patient.name} · ${purpose} · browser simulation`, "updated");
  return { ok: true, status: 200, data: { subject: patientId, action: granted ? "grant" : "revoke", purpose, consent: { ...flags }, simulated: true } };
}

export type IdentityParams = { system?: string; value?: string; subject?: string; identifier?: string };

export function identityQuery(params: IdentityParams): URLSearchParams {
  const qs = new URLSearchParams();
  if (params.subject?.trim()) qs.set("subject", params.subject.trim());
  const identifier = params.identifier?.trim() || (params.system?.trim() && params.value?.trim() ? `${params.system.trim()}:${params.value.trim()}` : params.value?.trim());
  if (identifier) qs.set("identifier", identifier);
  return qs;
}

export function simulateIdentity(params: IdentityParams): ApiResult<Record<string, unknown>> {
  const query = identityQuery(params);
  const subject = query.get("subject");
  const identifier = query.get("identifier");
  if (!subject && !identifier) return failure(400, "identifier_required", "Enter a demo preferred identifier or patient ID.");
  // Only these preferred identifiers exist in config/identity-registry.yaml.
  const registeredId = identifier === "urn:ehds:patient:eu-001" ? "patient-eu-001" : identifier === "urn:tefca:patient:us-001" ? "patient-us-001" : undefined;
  const patient = DEMO_PATIENTS.find((entry) => entry.id === (identifier ? registeredId : subject));
  if (!patient) return failure(404, "identifier_not_found", "No match in the demo registry. Try urn:ehds:patient:eu-001 or look up a sample patient ID.");
  record("Identity matched", `${patient.id} · ${patient.region} demo cell`, "allowed");
  return { ok: true, status: 200, data: {
    subject: patient.id,
    home_jurisdiction: patient.region === "EU" ? "eu-home" : "us-home",
    cell: patient.region.toLowerCase(),
    tenant: patient.region === "EU" ? "demo-tenant" : "us-demo-tenant",
    simulated: true,
  } };
}

export function simulateTriage(body: { patient_id: string; symptoms: string[] }): ApiResult<Record<string, unknown>> {
  const patient = DEMO_PATIENTS.find((entry) => entry.id === body.patient_id);
  if (!patient) return failure(404, "patient_not_found", "Choose a patient from the synthetic demo.");
  if (!body.symptoms.some((symptom) => symptom.trim())) return failure(400, "symptoms_required", "Add a sample observation to run the oversight demonstration.");
  record("Human review required", `${patient.name} · fixed governance example, not clinical advice`, "updated");
  return { ok: true, status: 200, data: {
    decision_id: `synthetic-review-${readState().sequence}`,
    status: "pending_human_oversight",
    explanation: "Fixed synthetic governance example. No clinical model ran; this output cannot diagnose, prioritize care, or approve a decision.",
    art50_transparency: true,
    human_oversight_required: true,
    simulated: true,
  } };
}
