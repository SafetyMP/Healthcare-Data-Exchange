package fhir

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestFailedRemoteDoesNotReturnSample(t *testing.T) {
	sampleDir := writeSample(t)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "not found", http.StatusNotFound)
	}))
	t.Cleanup(srv.Close)

	patient, err := NewClient(srv.URL, sampleDir).GetPatientForCell(context.Background(), "patient-eu-001", "eu", srv.URL)
	if patient != nil {
		t.Fatalf("substituted sample on HTTP %d: %#v", http.StatusNotFound, patient)
	}
	var status *StatusError
	if !errors.As(err, &status) || status.StatusCode != http.StatusNotFound {
		t.Fatalf("err=%v", err)
	}
}

func TestUnreachableRemoteDoesNotReturnSample(t *testing.T) {
	sampleDir := writeSample(t)
	srv := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}))
	srv.Close()

	patient, err := NewClient(srv.URL, sampleDir).GetPatientForCell(context.Background(), "patient-eu-001", "eu", srv.URL)
	if err == nil || patient != nil {
		t.Fatalf("patient=%#v err=%v", patient, err)
	}
	var status *StatusError
	if errors.As(err, &status) {
		t.Fatalf("transport failure reported as HTTP %d", status.StatusCode)
	}
}

func TestRemoteSuccessDoesNotReadSample(t *testing.T) {
	sampleDir := writeSample(t)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"resourceType": "Patient",
			"id":           "from-hapi",
		})
	}))
	t.Cleanup(srv.Close)

	patient, err := NewClient(srv.URL, sampleDir).GetPatientForCell(context.Background(), "patient-eu-001", "eu", "")
	if err != nil {
		t.Fatal(err)
	}
	if patient["id"] != "from-hapi" {
		t.Fatalf("id=%v", patient["id"])
	}
}

func TestSampleUsedOnlyWhenNoCellBase(t *testing.T) {
	sampleDir := writeSample(t)
	patient, err := NewClient("", sampleDir).GetPatientForCell(context.Background(), "patient-eu-001", "eu", "")
	if err != nil {
		t.Fatal(err)
	}
	if patient["id"] != "patient-eu-001" {
		t.Fatalf("id=%v", patient["id"])
	}
}

func writeSample(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	cell := filepath.Join(dir, "eu")
	if err := os.MkdirAll(cell, 0o755); err != nil {
		t.Fatal(err)
	}
	body := []byte(`{"resourceType":"Patient","id":"patient-eu-001","name":[{"family":"Mueller"}]}`)
	if err := os.WriteFile(filepath.Join(cell, "patient-eu-001.json"), body, 0o644); err != nil {
		t.Fatal(err)
	}
	return dir
}
