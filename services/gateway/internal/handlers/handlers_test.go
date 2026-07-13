package handlers_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/audit"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/broker"
	appconfig "github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/config"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/crypto"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/fhir"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/handlers"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/pep"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/principal"
)

const testAdminSecret = "test-admin-secret"

func TestMain(m *testing.M) {
	os.Setenv("CHEX_ADMIN_SECRET", testAdminSecret)
	os.Exit(m.Run())
}

func TestLanding(t *testing.T) {
	srv := &handlers.Server{ClinicianUIURL: "http://localhost:3100"}
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	srv.Landing(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "Cloud Healthcare Exchange") {
		t.Fatal("expected landing page title")
	}
	if !strings.Contains(body, "http://localhost:3100") {
		t.Fatal("expected clinician console link")
	}
}

func TestGetPatientAllowed(t *testing.T) {
	srv := newTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/v1/patients/patient-eu-001?purpose=treatment", nil)
	req.Header.Set("Authorization", euVisitingAuth())
	rec := httptest.NewRecorder()
	srv.GetPatient(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var body map[string]any
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body["home_jurisdiction"] != "eu-home" {
		t.Fatalf("home_jurisdiction=%v", body["home_jurisdiction"])
	}
	if body["requester_jurisdiction"] != "eu-visiting" {
		t.Fatalf("requester_jurisdiction=%v", body["requester_jurisdiction"])
	}
	if body["cross_bloc"] != false {
		t.Fatalf("cross_bloc=%v want false for intra-EU", body["cross_bloc"])
	}
}

func TestGetPatientDenied(t *testing.T) {
	srv := newTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/v1/patients/patient-eu-001?purpose=research", nil)
	req.Header.Set("Authorization", euHomeAuth())
	rec := httptest.NewRecorder()
	srv.GetPatient(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 got %d", rec.Code)
	}
}

func TestGetPatientCrossBlocDenied(t *testing.T) {
	srv := newTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/v1/patients/patient-eu-001?purpose=treatment", nil)
	req.Header.Set("Authorization", usClinicianAuth())
	rec := httptest.NewRecorder()
	srv.GetPatient(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 got %d body %s", rec.Code, rec.Body.String())
	}
	var body map[string]any
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body["reason"] != "residency_denied" {
		t.Fatalf("reason=%v", body["reason"])
	}
}

func TestGetPatientCrossBlocDerivativeException(t *testing.T) {
	srv := newTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/v1/patients/patient-eu-001?purpose=derivative", nil)
	req.Header.Set("Authorization", usClinicianAuth())
	rec := httptest.NewRecorder()
	srv.GetPatient(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 got %d body %s", rec.Code, rec.Body.String())
	}
	var body map[string]any
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	fields, _ := body["min_necessary_fields"].([]any)
	if len(fields) != 2 {
		t.Fatalf("min_necessary_fields=%v", body["min_necessary_fields"])
	}
}

func TestGetPatientRequiresSSRA(t *testing.T) {
	srv := newTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/v1/patients/patient-us-001?purpose=treatment", nil)
	rec := httptest.NewRecorder()
	srv.GetPatient(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 got %d body %s", rec.Code, rec.Body.String())
	}
}

func TestGetPatientUSRouted(t *testing.T) {
	fhirSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/fhir/Patient/patient-us-001" {
			http.NotFound(w, r)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"resourceType": "Patient",
			"id":           "patient-us-001",
			"name":         []map[string]any{{"family": "Smith"}},
		})
	}))
	defer fhirSrv.Close()

	srv := newTestServer(t)
	srv.Routing.Jurisdictions["us-home"] = appconfig.Jurisdiction{
		Cell:     "us",
		FHIRBase: fhirSrv.URL + "/fhir",
	}
	srv.Broker = broker.New(srv.Routing, nil)

	req := httptest.NewRequest(http.MethodGet, "/v1/patients/patient-us-001?purpose=treatment", nil)
	req.Header.Set("Authorization", ssraaAuth())
	rec := httptest.NewRecorder()
	srv.GetPatient(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var body map[string]any
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body["home_jurisdiction"] != "us-home" {
		t.Fatalf("home_jurisdiction=%v", body["home_jurisdiction"])
	}
	if body["home_cell"] != "us" {
		t.Fatalf("home_cell=%v", body["home_cell"])
	}
}

func TestGetPatientCrossBlocEUToUSDenied(t *testing.T) {
	srv := newTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/v1/patients/patient-us-001?purpose=treatment", nil)
	req.Header.Set("Authorization", euVisitingAuth())
	rec := httptest.NewRecorder()
	srv.GetPatient(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 got %d body %s", rec.Code, rec.Body.String())
	}
}

func TestGetPatientByIdentifier(t *testing.T) {
	fhirSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"resourceType": "Patient",
			"id":           "patient-us-001",
		})
	}))
	defer fhirSrv.Close()

	srv := newTestServer(t)
	srv.Routing.Jurisdictions["us-home"] = appconfig.Jurisdiction{
		Cell:     "us",
		FHIRBase: fhirSrv.URL + "/fhir",
	}
	srv.Broker = broker.New(srv.Routing, nil)

	req := httptest.NewRequest(http.MethodGet, "/v1/patients/_?identifier=urn:tefca:patient:us-001&purpose=treatment", nil)
	req.Header.Set("Authorization", ssraaAuth())
	rec := httptest.NewRecorder()
	srv.GetPatient(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
}

func TestResolveIdentity(t *testing.T) {
	srv := newTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/v1/identity/resolve?identifier=urn:ehds:patient:eu-001", nil)
	rec := httptest.NewRecorder()
	srv.ResolveIdentity(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var body map[string]any
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body["subject"] != "patient-eu-001" {
		t.Fatalf("subject=%v", body["subject"])
	}
	if body["cell"] != "eu" {
		t.Fatalf("cell=%v", body["cell"])
	}
}

func TestCryptoShred(t *testing.T) {
	keys, err := crypto.NewKeyStore(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	if err := keys.EnsureTenant("demo-tenant"); err != nil {
		t.Fatal(err)
	}
	if err := keys.ShredTenant("demo-tenant"); err != nil {
		t.Fatal(err)
	}
	if !keys.IsShredded("demo-tenant") {
		t.Fatal("expected tenant shredded")
	}
	if err := keys.EnsureTenant("demo-tenant"); err == nil {
		t.Fatal("expected ensure to fail after shred")
	}
}

func TestInvalidTenantKeyLength(t *testing.T) {
	dir := t.TempDir()
	keyPath := filepath.Join(dir, "demo-tenant.key")
	if err := os.WriteFile(keyPath, []byte("short"), 0o600); err != nil {
		t.Fatal(err)
	}
	keys, err := crypto.NewKeyStore(dir)
	if err != nil {
		t.Fatal(err)
	}
	if err := keys.EnsureTenant("demo-tenant"); err == nil {
		t.Fatal("expected invalid key length error")
	}
}

type stubConsent struct {
	gotSubject string
	gotAction  string
	gotPurpose string
	gotAuth    string
}

func (s *stubConsent) Set(_ context.Context, subject, action, purpose, adminAuth string) (map[string]any, int, error) {
	s.gotSubject = subject
	s.gotAction = action
	s.gotPurpose = purpose
	s.gotAuth = adminAuth
	return map[string]any{"subject": subject, "action": action, "consent": map[string]any{purpose: action == "grant"}}, http.StatusOK, nil
}

func TestConsentAdminProxies(t *testing.T) {
	srv := newTestServer(t)
	stub := &stubConsent{}
	srv.Consent = stub

	req := httptest.NewRequest(http.MethodPost, "/v1/admin/consent?subject=patient-eu-002&action=revoke&purpose=research", nil)
	req.Header.Set("Authorization", adminAuth())
	rec := httptest.NewRecorder()
	srv.ConsentAdminHandler(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	if stub.gotSubject != "patient-eu-002" || stub.gotAction != "revoke" || stub.gotPurpose != "research" {
		t.Fatalf("proxied args: %+v", stub)
	}
	if stub.gotAuth != adminAuth() {
		t.Fatalf("admin auth not forwarded: %q", stub.gotAuth)
	}
}

func TestConsentAdminRequiresAuth(t *testing.T) {
	srv := newTestServer(t)
	srv.Consent = &stubConsent{}

	req := httptest.NewRequest(http.MethodPost, "/v1/admin/consent?subject=patient-eu-002&action=revoke&purpose=research", nil)
	rec := httptest.NewRecorder()
	srv.ConsentAdminHandler(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 got %d", rec.Code)
	}
}

func TestConsentAdminUnavailable(t *testing.T) {
	srv := newTestServer(t)
	srv.Consent = nil

	req := httptest.NewRequest(http.MethodPost, "/v1/admin/consent?subject=x&action=grant", nil)
	req.Header.Set("Authorization", adminAuth())
	rec := httptest.NewRecorder()
	srv.ConsentAdminHandler(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503 got %d", rec.Code)
	}
}

func testPrincipals(t *testing.T) *principal.Broker {
	t.Helper()
	root := findRoot(t)
	b, err := principal.NewBroker(
		filepath.Join(root, "config/eu-auth.yaml"),
		filepath.Join(root, "config/ssraa.yaml"),
	)
	if err != nil {
		t.Fatal(err)
	}
	return b
}

func euHomeAuth() string      { return "Bearer eu-home-client.demo-eu-home-secret" }
func euVisitingAuth() string  { return "Bearer eu-visiting-client.demo-eu-visiting-secret" }
func usClinicianAuth() string { return "Bearer us-clinician-client.demo-us-clinician-secret" }
func ssraaAuth() string       { return "Bearer tefca-demo-client.demo-ssraa-secret" }
func adminAuth() string       { return "Bearer " + testAdminSecret }

func newTestServer(t *testing.T) *handlers.Server {
	t.Helper()
	root := findRoot(t)
	routing, err := appconfig.LoadRouting(filepath.Join(root, "config/routing.yaml"))
	if err != nil {
		t.Fatal(err)
	}
	keys, err := crypto.NewKeyStore(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	sampleDir := filepath.Join(root, "fhir/samples")
	opaBin := findOPABin(t, root)
	consent := map[string]map[string]bool{
		"patient-eu-001": {"research": false},
		"patient-eu-002": {"research": true},
		"patient-us-001": {"research": false},
		"patient-us-002": {"research": true},
	}

	return &handlers.Server{
		Routing:    routing,
		Broker:     broker.New(routing, nil),
		PEP:        pep.NewRegoEvaluator(opaBin, filepath.Join(root, "policy"), consent),
		FHIR:       fhir.NewClient("", sampleDir),
		Audit:      audit.NewSink(filepath.Join(t.TempDir(), "audit.jsonl")),
		Keys:       keys,
		Principals: testPrincipals(t),
	}
}

func findOPABin(t *testing.T, root string) string {
	t.Helper()
	candidates := []string{
		filepath.Join(root, ".tools/bin/opa"),
		"opa",
	}
	for _, c := range candidates {
		if c == "opa" {
			if p, err := exec.LookPath("opa"); err == nil {
				return p
			}
			continue
		}
		if _, err := os.Stat(c); err == nil {
			return c
		}
	}
	t.Fatal("opa binary not found; run ./scripts/verify.sh once to install .tools/bin/opa")
	return ""
}

func findRoot(t *testing.T) string {
	t.Helper()
	dir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	for {
		if _, err := os.Stat(filepath.Join(dir, "config/routing.yaml")); err == nil {
			return dir
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			t.Fatal("repo root not found")
		}
		dir = parent
	}
}
