package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/aigov"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/audit"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/broker"
	appconfig "github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/config"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/consent"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/crypto"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/fhir"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/handlers"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/pep"
)

func main() {
	root := env("CHEX_ROOT", ".")
	cfgPath := env("CHEX_ROUTING_CONFIG", filepath.Join(root, "config/routing.yaml"))
	opaURL := env("CHEX_OPA_URL", "http://localhost:8181")
	fhirBase := env("CHEX_FHIR_BASE", "")
	sampleDir := env("CHEX_FHIR_SAMPLES", filepath.Join(root, "fhir/samples"))
	auditPath := env("CHEX_AUDIT_PATH", filepath.Join(root, "data/audit/eu.jsonl"))
	keyDir := env("CHEX_KEY_DIR", filepath.Join(root, "data/keys"))
	addr := env("CHEX_GATEWAY_ADDR", ":8081")
	aiURL := env("CHEX_AI_GOV_URL", "http://localhost:8082")
	consentURL := env("CHEX_CONSENT_URL", "http://localhost:8084")

	routing, err := appconfig.LoadRouting(cfgPath)
	if err != nil {
		log.Fatalf("load routing: %v", err)
	}
	if err := os.MkdirAll(filepath.Dir(auditPath), 0o750); err != nil {
		log.Fatalf("audit dir: %v", err)
	}

	keys, err := crypto.NewKeyStore(keyDir)
	if err != nil {
		log.Fatalf("keystore: %v", err)
	}

	srv := &handlers.Server{
		Routing: routing,
		Broker:  broker.New(routing),
		PEP:     pep.NewClient(opaURL),
		FHIR:    fhir.NewClient(fhirBase, sampleDir),
		Audit:   audit.NewSink(auditPath),
		Keys:    keys,
		AI:      aigov.NewClient(aiURL),
		Consent: consent.NewClient(consentURL),
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", srv.Landing)
	mux.HandleFunc("/health", srv.Health)
	mux.HandleFunc("/v1/identity/resolve", srv.ResolveIdentity)
	mux.HandleFunc("/v1/patients/", srv.GetPatient)
	mux.HandleFunc("/v1/admin/erasure/tenant", srv.ShredTenant)
	mux.HandleFunc("/v1/admin/consent", srv.ConsentAdminHandler)
	mux.HandleFunc("/v1/ai/triage", srv.AITriage)

	log.Printf("gateway listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
