const API_BASE = "/api";

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

export async function getPatient(id: string, params: { purpose: string; requester_jurisdiction: string }) {
  const qs = new URLSearchParams(params);
  return request<Record<string, unknown>>(`/v1/patients/${encodeURIComponent(id)}?${qs}`);
}

export async function resolveIdentity(params: { system?: string; value?: string }) {
  const qs = new URLSearchParams();
  if (params.system) qs.set("system", params.system);
  if (params.value) qs.set("value", params.value);
  return request<Record<string, unknown>>(`/v1/identity/resolve?${qs}`);
}

export async function postConsent(body: {
  patient_id: string;
  purpose: string;
  granted: boolean;
  requester_jurisdiction?: string;
}) {
  return request<Record<string, unknown>>("/v1/admin/consent", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function postAiTriage(body: {
  patient_id: string;
  symptoms: string[];
  requester_jurisdiction?: string;
}) {
  return request<Record<string, unknown>>("/v1/ai/triage", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
