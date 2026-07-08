package broker_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/broker"
	appconfig "github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/config"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/identity"
)

func TestResolveBySubject(t *testing.T) {
	b := loadBroker(t, nil)

	token, ok := b.Resolve(context.Background(), "patient-eu-001", "")
	if !ok {
		t.Fatal("expected subject resolution")
	}
	if token.HomeJurisdiction != "eu-home" {
		t.Fatalf("home=%q want eu-home", token.HomeJurisdiction)
	}
	if token.Cell != "eu" {
		t.Fatalf("cell=%q want eu", token.Cell)
	}
}

func TestResolveByIdentifierConfigFallback(t *testing.T) {
	b := loadBroker(t, nil)

	token, ok := b.Resolve(context.Background(), "", "urn:tefca:patient:us-001")
	if !ok {
		t.Fatal("expected identifier resolution")
	}
	if token.SubjectID != "patient-us-001" {
		t.Fatalf("subject=%q want patient-us-001", token.SubjectID)
	}
	if token.HomeJurisdiction != "us-home" {
		t.Fatalf("home=%q want us-home", token.HomeJurisdiction)
	}
	if token.Cell != "us" {
		t.Fatalf("cell=%q want us", token.Cell)
	}
}

func TestResolveByIdentifierRemote(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("identifier") != "urn:broker:patient:remote-001" {
			http.NotFound(w, r)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]string{
			"subject":           "patient-us-002",
			"home_jurisdiction": "us-home",
		})
	}))
	t.Cleanup(srv.Close)

	b := loadBroker(t, identity.NewClient(srv.URL))
	token, ok := b.Resolve(context.Background(), "", "urn:broker:patient:remote-001")
	if !ok {
		t.Fatal("expected remote identifier resolution")
	}
	if token.SubjectID != "patient-us-002" {
		t.Fatalf("subject=%q want patient-us-002", token.SubjectID)
	}
	if token.Cell != "us" {
		t.Fatalf("cell=%q want us", token.Cell)
	}
}

func TestResolveUnknown(t *testing.T) {
	b := loadBroker(t, nil)
	if _, ok := b.Resolve(context.Background(), "missing", ""); ok {
		t.Fatal("expected miss for unknown subject")
	}
	if _, ok := b.Resolve(context.Background(), "", "urn:unknown:id"); ok {
		t.Fatal("expected miss for unknown identifier")
	}
}

func loadBroker(t *testing.T, remote broker.RemoteResolver) *broker.Broker {
	t.Helper()
	routing, err := appconfig.LoadRouting(filepath.Join(findRoot(t), "config/routing.yaml"))
	if err != nil {
		t.Fatal(err)
	}
	return broker.New(routing, remote)
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
