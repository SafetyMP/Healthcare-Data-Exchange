package broker_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/broker"
	appconfig "github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/config"
)

func TestResolveBySubject(t *testing.T) {
	b := loadBroker(t)

	token, ok := b.Resolve("patient-eu-001", "")
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

func TestResolveByIdentifier(t *testing.T) {
	b := loadBroker(t)

	token, ok := b.Resolve("", "urn:tefca:patient:us-001")
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

func TestResolveUnknown(t *testing.T) {
	b := loadBroker(t)
	if _, ok := b.Resolve("missing", ""); ok {
		t.Fatal("expected miss for unknown subject")
	}
	if _, ok := b.Resolve("", "urn:unknown:id"); ok {
		t.Fatal("expected miss for unknown identifier")
	}
}

func loadBroker(t *testing.T) *broker.Broker {
	t.Helper()
	routing, err := appconfig.LoadRouting(filepath.Join(findRoot(t), "config/routing.yaml"))
	if err != nil {
		t.Fatal(err)
	}
	return broker.New(routing)
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
