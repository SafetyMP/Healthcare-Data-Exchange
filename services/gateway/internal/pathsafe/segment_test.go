package pathsafe

import (
	"path/filepath"
	"testing"
)

func TestValidateSegmentRejectsTraversal(t *testing.T) {
	cases := []string{"../etc", "..\\win", "foo/bar", ""}
	for _, c := range cases {
		if err := ValidateSegment(c, "test"); err == nil {
			t.Fatalf("expected error for %q", c)
		}
	}
}

func TestValidateSegmentAllowsSafeIDs(t *testing.T) {
	cases := []string{"tenant-1", "patient_123", "eu", "v1.0"}
	for _, c := range cases {
		if err := ValidateSegment(c, "test"); err != nil {
			t.Fatalf("unexpected error for %q: %v", c, err)
		}
	}
}

func TestSafeJoinRejectsEscape(t *testing.T) {
	base := filepath.Join(t.TempDir(), "keys")
	if _, err := SafeJoin(base, "..", "outside.key"); err == nil {
		t.Fatal("expected escape to be rejected")
	}
}

func TestSafeJoinAllowsNestedFile(t *testing.T) {
	base := t.TempDir()
	got, err := SafeJoin(base, "eu", "patient-1.json")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := filepath.Join(base, "eu", "patient-1.json")
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
}
