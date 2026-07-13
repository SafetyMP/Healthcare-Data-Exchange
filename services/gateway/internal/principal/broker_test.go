package principal_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/principal"
)

func TestBrokerFromConfigFiles(t *testing.T) {
	root := findRoot(t)
	b, err := principal.NewBroker(
		filepath.Join(root, "config/eu-auth.yaml"),
		filepath.Join(root, "config/ssraa.yaml"),
	)
	if err != nil {
		t.Fatal(err)
	}

	p, ok := b.Authenticate("Bearer eu-visiting-client.demo-eu-visiting-secret")
	if !ok || p.Jurisdiction != "eu-visiting" || p.Cell != "eu" || p.AuthKind != "eu-bearer" {
		t.Fatalf("eu principal=%+v ok=%v", p, ok)
	}

	p, ok = b.Authenticate("Bearer us-clinician-client.demo-us-clinician-secret")
	if !ok || p.Jurisdiction != "us-clinician" || p.Cell != "us" || !p.CrossBlocPermitted {
		t.Fatalf("us principal=%+v ok=%v", p, ok)
	}

	if _, ok := b.Authenticate(""); ok {
		t.Fatal("expected reject for missing header")
	}
}

func TestDenyReasonPerCell(t *testing.T) {
	b := &principal.Broker{}
	if b.DenyReason("us") != "ssraa_required" {
		t.Fatal("us deny reason")
	}
	if b.DenyReason("eu") != "credential_required" {
		t.Fatal("eu deny reason")
	}
}

func findRoot(t *testing.T) string {
	t.Helper()
	dir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	for {
		if _, err := os.Stat(filepath.Join(dir, "config/eu-auth.yaml")); err == nil {
			return dir
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			t.Fatal("repo root not found")
		}
		dir = parent
	}
}
