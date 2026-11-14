import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Execute the actual adapters with isolated browser storage and fetch. TypeScript
// is already a project dependency; no browser or backend is required for this suite.
const sources = Object.fromEntries(["api", "demo"].map((name) => [name,
  ts.transpileModule(readFileSync(new URL(`../../src/lib/${name}.ts`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
]));

function harness({ mode = true, store = new Map(), fetch: fetchOverride, storageDisabled = false } = {}) {
  const events = [];
  const requests = [];
  const window = {
    sessionStorage: {
      getItem(key) { if (storageDisabled) throw new Error("Storage disabled"); return store.get(key) ?? null; },
      setItem(key, value) { if (storageDisabled) throw new Error("Storage disabled"); store.set(key, value); },
    },
    dispatchEvent(event) { events.push(event.type); },
  };
  function load(name, imports) {
    const exports = {};
    vm.runInNewContext(sources[name], {
      exports,
      require(id) { assert.equal(id, "@/lib/demo"); return imports; },
      process: { env: { NEXT_PUBLIC_DEMO_MODE: String(mode) } },
      window, Event, URLSearchParams, Date,
      fetch: async (url, init) => {
        requests.push({ url, init });
        if (fetchOverride) return fetchOverride(url, init);
        throw new Error("Unexpected network request in demo mode");
      },
    });
    return exports;
  }
  const demo = load("demo");
  const api = load("api", demo);
  return { demo, api, store, events, requests };
}

function response(status, body, statusText = "") {
  return { status, statusText, ok: status >= 200 && status < 300, text: async () => typeof body === "string" ? body : JSON.stringify(body) };
}

function read(api, { patient = "patient-eu-001", purpose = "treatment", credential = "eu-visiting" } = {}) {
  return api.getPatient(patient, { purpose }, api.DEMO_CREDENTIALS[credential] ?? credential);
}

function consent(api, purpose, granted) {
  return api.postConsent({ patient_id: "patient-eu-001", purpose, granted, admin_token: "" });
}

test("demo consent grant/revoke changes subsequent reads, including treatment", async () => {
  const { api, demo, requests } = harness();
  assert.equal((await read(api)).ok, true);
  assert.equal((await read(api, { purpose: "research" })).status, 403);
  await consent(api, "research", true);
  assert.equal((await read(api, { purpose: "research" })).ok, true);
  await consent(api, "research", false);
  assert.equal((await read(api, { purpose: "research" })).body.reason, "consent_required");
  await consent(api, "treatment", false);
  assert.equal((await read(api)).status, 403);
  assert.equal(demo.getDemoConsent("patient-eu-002", "research"), true);
  assert.equal(requests.length, 0);
});

test("cross-region access denies by default and limits the permitted derivative", async () => {
  const { api, requests } = harness();
  assert.equal((await read(api, { credential: "us-home" })).body.reason, "residency_denied");
  assert.equal((await read(api, { credential: "us-home", purpose: "derivative" })).status, 403);
  const result = await read(api, { credential: "us-clinician", purpose: "derivative" });
  assert.equal(result.ok, true);
  assert.equal(Object.keys(result.data.patient).sort().join(","), "id,resourceType");
  assert.equal(result.data.min_necessary_fields.sort().join(","), "id,resourceType");
  await consent(api, "derivative", false);
  assert.equal((await read(api, { credential: "us-clinician", purpose: "derivative" })).body.reason, "consent_required");
  assert.equal(requests.length, 0);
});

test("unknown demo patient, purpose, credential and consent target fail closed", async () => {
  const { api, requests } = harness();
  assert.equal((await read(api, { patient: "missing" })).status, 404);
  assert.equal((await read(api, { purpose: "unknown" })).status, 400);
  assert.equal((await read(api, { credential: "invalid" })).status, 401);
  assert.equal((await api.postConsent({ patient_id: "missing", purpose: "research", granted: true, admin_token: "" })).status, 404);
  assert.equal((await consent(api, "unknown", true)).status, 400);
  assert.equal(requests.length, 0);
});

test("demo identity, oversight and health use fixture results without network", async () => {
  const { api, requests } = harness();
  assert.equal((await api.resolveIdentity({ identifier: "urn:ehds:patient:eu-001" })).data.subject, "patient-eu-001");
  assert.equal((await api.resolveIdentity({ subject: "patient-us-002" })).data.cell, "us");
  assert.equal((await api.resolveIdentity({ identifier: "unknown" })).status, 404);
  assert.equal((await api.resolveIdentity({})).status, 400);
  const review = await api.postAiTriage({ patient_id: "patient-eu-001", symptoms: ["sample"] });
  assert.equal(review.data.human_oversight_required, true);
  assert.equal(review.data.status, "pending_human_oversight");
  assert.equal(review.data.simulated, true);
  assert.equal("score" in review.data, false);
  assert.equal((await api.postAiTriage({ patient_id: "missing", symptoms: ["sample"] })).status, 404);
  assert.equal((await api.postAiTriage({ patient_id: "patient-eu-001", symptoms: [" "] })).status, 400);
  assert.equal((await api.getHealth()).data.status, "simulation");
  assert.equal(requests.length, 0);
});

test("consent and activity survive a reload; reset restores defaults and emits its own event", async () => {
  const first = harness();
  await consent(first.api, "derivative", false);
  assert.equal(first.events.includes(first.demo.DEMO_RESET_EVENT), false);
  const reloaded = harness({ store: first.store });
  assert.equal(reloaded.demo.getDemoConsent("patient-eu-001", "derivative"), false);
  assert.equal(reloaded.demo.getDemoActivity().length, 1);
  reloaded.demo.resetDemo();
  assert.equal(reloaded.demo.getDemoConsent("patient-eu-001", "derivative"), true);
  assert.equal(reloaded.demo.getDemoConsent("patient-eu-001", "research"), false);
  assert.equal(reloaded.demo.getDemoActivity().length, 0);
  assert.deepEqual(reloaded.events, [reloaded.demo.DEMO_EVENT, reloaded.demo.DEMO_RESET_EVENT]);
});

test("blocked or malformed browser storage does not crash the demo", async () => {
  const blocked = harness({ storageDisabled: true });
  await consent(blocked.api, "research", true);
  assert.equal((await read(blocked.api, { purpose: "research" })).ok, true);
  const corrupt = harness({ store: new Map([["chex-synthetic-demo-v1", '{"version":1,"consent":null}']]) });
  assert.equal(corrupt.demo.getDemoConsent("patient-eu-001", "research"), false);
  assert.equal(corrupt.demo.getDemoActivity().length, 0);
});

test("live requests use gateway identity and AI contracts and preserve bearer authorization", async () => {
  const { api, demo, requests, events } = harness({ mode: false, fetch: () => response(200, {}) });
  await api.resolveIdentity({ system: "urn:ehds:patient", value: "eu-001" });
  assert.equal(requests[0].url, "/api/v1/identity/resolve?identifier=urn%3Aehds%3Apatient%3Aeu-001");
  await api.resolveIdentity({ subject: "patient-us-002" });
  assert.equal(requests[1].url, "/api/v1/identity/resolve?subject=patient-us-002");
  await api.postAiTriage({ patient_id: "patient-eu-001", symptoms: ["sample"] });
  assert.deepEqual(JSON.parse(requests[2].init.body), { subject_pseudonym: "patient-eu-001", features: { symptoms: ["sample"] } });
  await read(api);
  assert.equal(requests[3].init.headers.Authorization, api.DEMO_CREDENTIALS["eu-visiting"]);
  await api.postConsent({ patient_id: "patient-eu-001", purpose: "research", granted: false, admin_token: "test-admin-token" });
  assert.equal(requests[4].init.headers.Authorization, "Bearer test-admin-token");
  assert.equal(requests[4].url, "/api/v1/admin/consent?subject=patient-eu-001&action=revoke&purpose=research");
  demo.resetDemo();
  assert.equal(events.length, 0);
});

test("live policy reason codes produce specific actionable explanations", async () => {
  for (const [reason, expected] of [
    ["consent_required", /Consent for this purpose is not granted/],
    ["residency_denied", /different regions/],
    ["xp_denied", /exchange purpose is not permitted/],
    ["unrecognized_reason", /gateway policy denied this request/],
  ]) {
    const { api } = harness({ mode: false, fetch: () => response(403, { error: "policy_denied", reason }, "Forbidden") });
    const result = await read(api);
    assert.equal(result.ok, false);
    assert.equal(result.status, 403);
    assert.equal(result.body.reason, reason);
    assert.match(result.error, expected);
  }
});

test("live unavailable, unknown and validation errors remain distinct from policy denial", async () => {
  for (const [status, body, expected] of [
    [503, { error: "policy_denied", reason: "consent_required" }, /service is unavailable/],
    [401, "unauthorized", /could not authenticate/],
    [404, "not found", /record was not found/],
    [400, { detail: "subject or identifier required" }, /subject or identifier required/],
    [400, { message: "Missing purpose" }, /Missing purpose/],
    [400, {}, /HTTP 400/],
    [400, "subject or identifier required", /subject or identifier required/],
  ]) {
    const { api } = harness({ mode: false, fetch: () => response(status, body) });
    const result = await read(api);
    assert.equal(result.status, status);
    assert.match(result.error, expected);
  }
  const { api } = harness({ mode: false, fetch: () => { throw new Error("ECONNREFUSED"); } });
  const unreachable = await read(api);
  assert.equal(unreachable.status, 0);
  assert.match(unreachable.error, /gateway could not be reached/);
});
