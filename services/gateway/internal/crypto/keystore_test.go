package crypto_test

import (
	"encoding/hex"
	"strings"
	"testing"

	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/crypto"
)

func TestPseudonymHMACStableAndTenantScoped(t *testing.T) {
	ks, err := crypto.NewKeyStore(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	if err := ks.EnsureTenant("tenant-a"); err != nil {
		t.Fatal(err)
	}
	if err := ks.EnsureTenant("tenant-b"); err != nil {
		t.Fatal(err)
	}

	first, err := ks.Pseudonym("tenant-a", "patient-eu-001")
	if err != nil {
		t.Fatal(err)
	}
	second, err := ks.Pseudonym("tenant-a", "patient-eu-001")
	if err != nil {
		t.Fatal(err)
	}
	if first != second {
		t.Fatalf("expected deterministic HMAC, got %q vs %q", first, second)
	}
	if !strings.HasPrefix(first, "v2:") {
		t.Fatalf("expected v2 prefix, got %q", first)
	}
	digest := strings.TrimPrefix(first, "v2:")
	if len(digest) != 64 {
		t.Fatalf("expected full SHA-256 hex (64 chars), got %d", len(digest))
	}
	if _, err := hex.DecodeString(digest); err != nil {
		t.Fatalf("expected hex digest: %v", err)
	}
	if strings.Contains(first, "patient-eu-001") {
		t.Fatal("raw subject leaked into pseudonym")
	}

	otherTenant, err := ks.Pseudonym("tenant-b", "patient-eu-001")
	if err != nil {
		t.Fatal(err)
	}
	if otherTenant == first {
		t.Fatal("expected tenant-scoped MAC keys to diverge")
	}

	otherSubject, err := ks.Pseudonym("tenant-a", "patient-eu-002")
	if err != nil {
		t.Fatal(err)
	}
	if otherSubject == first {
		t.Fatal("expected different subjects to produce different MAC values")
	}
}

func TestPseudonymRequiresTenantAndSubject(t *testing.T) {
	ks, err := crypto.NewKeyStore(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	if _, err := ks.Pseudonym("missing", "patient-eu-001"); err == nil {
		t.Fatal("expected missing tenant key to fail")
	}
	if err := ks.EnsureTenant("tenant-a"); err != nil {
		t.Fatal(err)
	}
	if _, err := ks.Pseudonym("tenant-a", ""); err == nil {
		t.Fatal("expected empty subject to fail")
	}
}
