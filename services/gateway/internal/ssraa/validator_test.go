package ssraa_test

import (
	"testing"

	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/ssraa"
)

func TestValidateAcceptsRegisteredClient(t *testing.T) {
	v := ssraa.NewValidator(&ssraa.Config{
		Required: true,
		Associations: map[string]ssraa.Association{
			"tefca-demo-client": {Secret: "demo-ssraa-secret", Scopes: []string{"patient.read"}},
		},
	})
	id, ok := v.Validate("Bearer tefca-demo-client.demo-ssraa-secret")
	if !ok || id != "tefca-demo-client" {
		t.Fatalf("validate=%v id=%q", ok, id)
	}
}

func TestValidateRejectsMissingHeader(t *testing.T) {
	v := ssraa.NewValidator(&ssraa.Config{Required: true, Associations: map[string]ssraa.Association{
		"c": {Secret: "s"},
	}})
	if _, ok := v.Validate(""); ok {
		t.Fatal("expected reject for missing header")
	}
}

func TestValidateRejectsBadSecret(t *testing.T) {
	v := ssraa.NewValidator(&ssraa.Config{
		Required: true,
		Associations: map[string]ssraa.Association{
			"tefca-demo-client": {Secret: "demo-ssraa-secret"},
		},
	})
	if _, ok := v.Validate("Bearer tefca-demo-client.wrong"); ok {
		t.Fatal("expected reject for wrong secret")
	}
}

func TestNotRequiredWhenDisabled(t *testing.T) {
	v := ssraa.NewValidator(&ssraa.Config{Required: false})
	if _, ok := v.Validate(""); !ok {
		t.Fatal("expected allow when SSRAA not required")
	}
}
