package config_test

import (
	"os"
	"path/filepath"
	"testing"

	appconfig "github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/config"
)

func TestIsCrossBloc(t *testing.T) {
	routing, err := appconfig.LoadRouting(filepath.Join(findRoot(t), "config/routing.yaml"))
	if err != nil {
		t.Fatal(err)
	}

	if routing.IsCrossBloc("eu-visiting", "eu-home") {
		t.Fatal("intra-EU visiting clinician should not be cross-bloc")
	}
	if !routing.IsCrossBloc("us-clinician", "eu-home") {
		t.Fatal("US requester to EU home should be cross-bloc")
	}
	if !routing.IsCrossBloc("us-home", "eu-home") {
		t.Fatal("US home vs EU home should be cross-bloc")
	}
	if routing.IsCrossBloc("us-home", "us-home") {
		t.Fatal("same-cell US should not be cross-bloc")
	}
}

func TestResolveRoutingIdentifierPrecedence(t *testing.T) {
	routing, err := appconfig.LoadRouting(filepath.Join(findRoot(t), "config/routing.yaml"))
	if err != nil {
		t.Fatal(err)
	}

	token, ok := routing.ResolveRouting("patient-eu-001", "urn:tefca:patient:us-001")
	if !ok {
		t.Fatal("expected resolution")
	}
	if token.SubjectID != "patient-us-001" {
		t.Fatalf("identifier should win: got subject %q", token.SubjectID)
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
