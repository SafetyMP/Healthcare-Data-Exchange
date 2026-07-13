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
        error: typeof body === "object" && body && "message" in body ? String((body as { message: string }).message) : res.statusText,
        status: res.status,
        body,
      };
    }
    return { ok: true, data: body as T, status: res.status };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error", status: 0 };
  }
}

export async function getHealth() {
  return request<{ status?: string }>("/health");
}

export async function getPatient(id: string, params: { purpose: string }, authorization: string) {
  const qs = new URLSearchParams({ purpose: params.purpose });
  return request<Record<string, unknown>>(`/v1/patients/${encodeURIComponent(id)}?${qs}`, {
    headers: { Authorization: authorization },
  });
}

export async function resolveIdentity(params: { system?: string; value?: string }) {
  const qs = new URLSearchParams();
  if (params.system) qs.set("system", params.system);
  if (params.value) qs.set("value", params.value);
  return request<Record<string, unknown>>(`/v1/identity/resolve?${qs}`);
}

export async function postConsent(params: {
  patient_id: string;
  purpose: string;
  granted: boolean;
  admin_token: string;
}) {
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
  return request<Record<string, unknown>>("/v1/ai/triage", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
