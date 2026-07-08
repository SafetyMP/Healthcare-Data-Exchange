package identity_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/identity"
)

func TestResolveIdentifier(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("identifier") != "urn:tefca:patient:us-001" {
			http.NotFound(w, r)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]string{
			"subject":           "patient-us-001",
			"home_jurisdiction": "us-home",
		})
	}))
	t.Cleanup(srv.Close)

	client := identity.NewClient(srv.URL)
	subject, home, ok := client.Resolve(context.Background(), "", "urn:tefca:patient:us-001")
	if !ok {
		t.Fatal("expected ok")
	}
	if subject != "patient-us-001" || home != "us-home" {
		t.Fatalf("got subject=%q home=%q", subject, home)
	}
}

func TestResolveNotFound(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.NotFound(w, nil)
	}))
	t.Cleanup(srv.Close)

	client := identity.NewClient(srv.URL)
	if _, _, ok := client.Resolve(context.Background(), "", "urn:missing"); ok {
		t.Fatal("expected miss")
	}
}
