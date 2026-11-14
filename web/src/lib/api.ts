import { IS_DEMO, identityQuery, simulateConsent, simulateIdentity, simulatePatient, simulateTriage, type IdentityParams } from "@/lib/demo";

const API_BASE = "/api";

/** Demo credentials — EU: config/eu-auth.yaml; US: config/ssraa.yaml (ADR 0009). */
export const DEMO_CREDENTIALS = {
  "eu-home": "Bearer eu-home-client.demo-eu-home-secret",
  "eu-visiting": "Bearer eu-visiting-client.demo-eu-visiting-secret",
  "us-home": "Bearer tefca-demo-client.demo-ssraa-secret",
  "us-clinician": "Bearer us-clinician-client.demo-us-clinician-secret",
} as const;

export type CredentialProfile = keyof typeof DEMO_CREDENTIALS;

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number; body?: unknown };

function responseError(status: number, statusText: string, body: unknown): string {
  const fields = typeof body === "object" && body !== null ? body as Record<string, unknown> : undefined;
  // Gateway denials use error/reason, while other services may use message/detail.
  // Only classify actual 403 responses as policy denials, not service failures.
  if (status === 403 && fields?.error === "policy_denied") {
    switch (fields.reason) {
      case "consent_required":
        return "Consent for this purpose is not granted. Review the patient's consent, then check access again.";
      case "residency_denied":
        return "The caller and patient are in different regions. Consent alone does not permit this transfer. Use an authorized caller in the patient's region or an explicitly permitted derivative request.";
      case "xp_denied":
        return "The exchange purpose is not permitted for this request. Choose a supported purpose and check the caller context.";
      default:
        return "The gateway policy denied this request. Review the caller, purpose, and patient context before trying again.";
    }
  }
  if (status >= 500) return `The gateway or a required service is unavailable (HTTP ${status}). Check the local backend and try again.`;
  for (const field of [fields?.message, fields?.detail]) {
    if (typeof field === "string" && field.trim()) return field.trim();
  }
  if (status === 401) return "The gateway could not authenticate this request. Check the caller credential or admin token.";
  if (status === 403) return "The gateway denied this request. Check the caller's permissions and request context.";
  if (status === 404) return "The requested record was not found. Check the patient or identifier and try again.";
  if (typeof body === "string" && body.trim() && !body.includes("<")) return body.trim().slice(0, 300);
  return statusText?.trim() || `The request failed (HTTP ${status}).`;
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const text = await res.text();
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    if (!res.ok) {
      return {
        ok: false,
        error: responseError(res.status, res.statusText, body),
        status: res.status,
        body,
      };
    }
    return { ok: true, data: body as T, status: res.status };
  } catch {
    return { ok: false, error: "The gateway could not be reached. Check that the local backend is running, then try again.", status: 0 };
  }
}

export async function getHealth() {
  if (IS_DEMO) return { ok: true, data: { status: "simulation" }, status: 200 } as const;
  return request<{ status?: string }>("/health");
}

export async function getPatient(id: string, params: { purpose: string }, authorization: string) {
  if (IS_DEMO) {
    const profile = (Object.keys(DEMO_CREDENTIALS) as CredentialProfile[]).find((key) => DEMO_CREDENTIALS[key] === authorization);
    return simulatePatient(id, params.purpose, profile);
  }
  const qs = new URLSearchParams({ purpose: params.purpose });
  return request<Record<string, unknown>>(`/v1/patients/${encodeURIComponent(id)}?${qs}`, {
    headers: { Authorization: authorization },
  });
}

export async function resolveIdentity(params: IdentityParams) {
  if (IS_DEMO) return simulateIdentity(params);
  // Gateway accepts a preferred identifier or subject, not system/value fields.
  const qs = identityQuery(params);
  return request<Record<string, unknown>>(`/v1/identity/resolve?${qs}`);
}

export async function postConsent(params: {
  patient_id: string;
  purpose: string;
  granted: boolean;
  admin_token: string;
}) {
  if (IS_DEMO) return simulateConsent(params.patient_id, params.purpose, params.granted);
  const action = params.granted ? "grant" : "revoke";
  const qs = new URLSearchParams({
    subject: params.patient_id,
    action,
    purpose: params.purpose,
  });
  return request<Record<string, unknown>>(`/v1/admin/consent?${qs}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${params.admin_token}` },
  });
}

export async function postAiTriage(body: { patient_id: string; symptoms: string[] }) {
  if (IS_DEMO) return simulateTriage(body);
  return request<Record<string, unknown>>("/v1/ai/triage", {
    method: "POST",
    body: JSON.stringify({ subject_pseudonym: body.patient_id, features: { symptoms: body.symptoms } }),
  });
}
