package handlers_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
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
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/ssraa"
)

func TestLanding(t *testing.T) {
	srv := &handlers.Server{}
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	srv.Landing(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 got %d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "Cloud Healthcare Exchange") {
		t.Fatal("expected landing page title")
	}
}

func TestGetPatientAllowed(t *testing.T) {
	srv := newTestServer(t, allowOPA(), "", "")

	req := httptest.NewRequest(http.MethodGet, "/v1/patients/patient-eu-001?purpose=treatment&requester_jurisdiction=eu-visiting", nil)
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
	if body["home_cell"] != "eu" {
		t.Fatalf("home_cell=%v", body["home_cell"])
	}
	if body["cross_bloc"] != false {
		t.Fatalf("cross_bloc=%v want false for intra-EU", body["cross_bloc"])
	}
}

func TestGetPatientDenied(t *testing.T) {
	srv := newTestServer(t, denyOPA("consent_required"), "", "")

	req := httptest.NewRequest(http.MethodGet, "/v1/patients/patient-eu-001?purpose=research", nil)
	rec := httptest.NewRecorder()
	srv.GetPatient(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 got %d", rec.Code)
	}
}

func TestGetPatientCrossBlocDenied(t *testing.T) {
	srv := newTestServer(t, denyOPA("residency_denied"), "", "")

	req := httptest.NewRequest(http.MethodGet, "/v1/patients/patient-eu-001?purpose=treatment&requester_jurisdiction=us-clinician", nil)
	rec := httptest.NewRecorder()
	srv.GetPatient(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 got %d body %s", rec.Code, rec.Body.String())
	}
}

func TestGetPatientUSRequiresSSRA(t *testing.T) {
	srv := newTestServer(t, allowOPA(), "", "")
	srv.SSRAA = testSSRA()

	req := httptest.NewRequest(http.MethodGet, "/v1/patients/patient-us-001?purpose=treatment&requester_jurisdiction=us-clinician", nil)
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

	srv := newTestServer(t, allowOPA(), "", "")
	srv.SSRAA = testSSRA()
	srv.Routing.Jurisdictions["us-home"] = appconfig.Jurisdiction{
		Cell:     "us",
		FHIRBase: fhirSrv.URL + "/fhir",
	}
	srv.Broker = broker.New(srv.Routing)

	req := httptest.NewRequest(http.MethodGet, "/v1/patients/patient-us-001?purpose=treatment&requester_jurisdiction=us-home", nil)
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
	if !strings.HasPrefix(body["routed_fhir_base"].(string), "http://") {
		t.Fatalf("routed_fhir_base=%v", body["routed_fhir_base"])
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

	srv := newTestServer(t, allowOPA(), "", "")
	srv.SSRAA = testSSRA()
	srv.Routing.Jurisdictions["us-home"] = appconfig.Jurisdiction{
		Cell:     "us",
		FHIRBase: fhirSrv.URL + "/fhir",
	}
	srv.Broker = broker.New(srv.Routing)

	req := httptest.NewRequest(http.MethodGet, "/v1/patients/_?identifier=urn:tefca:patient:us-001&purpose=treatment&requester_jurisdiction=us-home", nil)
	req.Header.Set("Authorization", ssraaAuth())
	rec := httptest.NewRecorder()
	srv.GetPatient(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
}

func TestResolveIdentity(t *testing.T) {
	srv := newTestServer(t, allowOPA(), "", "")

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

type stubConsent struct {
	gotSubject string
	gotAction  string
	gotPurpose string
}

func (s *stubConsent) Set(_ context.Context, subject, action, purpose string) (map[string]any, int, error) {
	s.gotSubject = subject
	s.gotAction = action
	s.gotPurpose = purpose
	return map[string]any{"subject": subject, "action": action, "consent": map[string]any{purpose: action == "grant"}}, http.StatusOK, nil
}

func TestConsentAdminProxies(t *testing.T) {
	srv := newTestServer(t, allowOPA(), "", "")
	stub := &stubConsent{}
	srv.Consent = stub

	req := httptest.NewRequest(http.MethodPost, "/v1/admin/consent?subject=patient-eu-002&action=revoke&purpose=research", nil)
	rec := httptest.NewRecorder()
	srv.ConsentAdminHandler(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	if stub.gotSubject != "patient-eu-002" || stub.gotAction != "revoke" || stub.gotPurpose != "research" {
		t.Fatalf("proxied args: %+v", stub)
	}
}

func TestConsentAdminUnavailable(t *testing.T) {
	srv := newTestServer(t, allowOPA(), "", "")
	srv.Consent = nil

	req := httptest.NewRequest(http.MethodPost, "/v1/admin/consent?subject=x&action=grant", nil)
	rec := httptest.NewRecorder()
	srv.ConsentAdminHandler(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503 got %d", rec.Code)
	}
}

func testSSRA() *ssraa.Validator {
	return ssraa.NewValidator(&ssraa.Config{
		Required: true,
		Associations: map[string]ssraa.Association{
			"tefca-demo-client": {Secret: "demo-ssraa-secret", Scopes: []string{"patient.read"}},
		},
	})
}

func ssraaAuth() string {
	return "Bearer tefca-demo-client.demo-ssraa-secret"
}

func newTestServer(t *testing.T, opaHandler http.HandlerFunc, fhirBase, sampleDir string) *handlers.Server {
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
	if sampleDir == "" {
		sampleDir = filepath.Join(root, "fhir/samples")
	}

	opa := httptest.NewServer(opaHandler)
	t.Cleanup(opa.Close)

	return &handlers.Server{
		Routing: routing,
		Broker:  broker.New(routing),
		PEP:     pep.NewClient(opa.URL),
		FHIR:    fhir.NewClient(fhirBase, sampleDir),
		Audit:   audit.NewSink(filepath.Join(t.TempDir(), "audit.jsonl")),
		Keys:    keys,
	}
}

func allowOPA() http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"result": map[string]any{
				"allow":                true,
				"min_necessary_fields": []string{"id", "resourceType", "name", "birthDate", "gender"},
			},
		})
	}
}

func denyOPA(reason string) http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"result": map[string]any{
				"allow":       false,
				"deny_reason": reason,
			},
		})
	}
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
