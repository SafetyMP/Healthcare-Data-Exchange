package handlers_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/audit"
	appconfig "github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/config"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/crypto"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/fhir"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/handlers"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/pep"
)

func TestGetPatientAllowed(t *testing.T) {
	root := findRoot(t)
	routing, err := appconfig.LoadRouting(filepath.Join(root, "config/routing.yaml"))
	if err != nil {
		t.Fatal(err)
	}
	keys, err := crypto.NewKeyStore(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}

	opa := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"result": map[string]any{
				"allow":                true,
				"min_necessary_fields": []string{"id", "resourceType", "name", "birthDate", "gender"},
			},
		})
	}))
	defer opa.Close()

	srv := &handlers.Server{
		Routing: routing,
		PEP:     pep.NewClient(opa.URL),
		FHIR:    fhir.NewClient("", filepath.Join(root, "fhir/samples")),
		Audit:   audit.NewSink(filepath.Join(t.TempDir(), "audit.jsonl")),
		Keys:    keys,
	}

	req := httptest.NewRequest(http.MethodGet, "/v1/patients/patient-eu-001?purpose=treatment&requester_jurisdiction=eu-visiting", nil)
	rec := httptest.NewRecorder()
	srv.GetPatient(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
}

func TestGetPatientDenied(t *testing.T) {
	root := findRoot(t)
	routing, err := appconfig.LoadRouting(filepath.Join(root, "config/routing.yaml"))
	if err != nil {
		t.Fatal(err)
	}
	keys, err := crypto.NewKeyStore(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}

	opa := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"result": map[string]any{
				"allow":       false,
				"deny_reason": "consent_required",
			},
		})
	}))
	defer opa.Close()

	srv := &handlers.Server{
		Routing: routing,
		PEP:     pep.NewClient(opa.URL),
		FHIR:    fhir.NewClient("", filepath.Join(root, "fhir/samples")),
		Audit:   audit.NewSink(filepath.Join(t.TempDir(), "audit.jsonl")),
		Keys:    keys,
	}

	req := httptest.NewRequest(http.MethodGet, "/v1/patients/patient-eu-001?purpose=research", nil)
	rec := httptest.NewRecorder()
	srv.GetPatient(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 got %d", rec.Code)
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
