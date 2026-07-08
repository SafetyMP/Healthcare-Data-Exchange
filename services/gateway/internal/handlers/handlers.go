package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/audit"
	appconfig "github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/config"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/crypto"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/fhir"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/pep"
)

type AIGovernance interface {
	Triage(ctx context.Context, payload map[string]any) (map[string]any, error)
}

type Server struct {
	Routing *appconfig.Routing
	PEP     *pep.Client
	FHIR    *fhir.Client
	Audit   *audit.Sink
	Keys    *crypto.KeyStore
	AI      AIGovernance
}

func (s *Server) Health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "gateway"})
}

func (s *Server) GetPatient(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	subjectID := strings.TrimPrefix(r.URL.Path, "/v1/patients/")
	subjectID = strings.Trim(subjectID, "/")
	if subjectID == "" {
		http.Error(w, "missing patient id", http.StatusBadRequest)
		return
	}

	requester := r.URL.Query().Get("requester_jurisdiction")
	if requester == "" {
		requester = "eu-visiting"
	}
	purpose := r.URL.Query().Get("purpose")
	if purpose == "" {
		purpose = "treatment"
	}
	crossBloc := r.URL.Query().Get("cross_bloc") == "true"
	crossPermitted := r.URL.Query().Get("cross_bloc_permitted") == "true"

	sub, _, tenant, ok := s.Routing.ResolveSubject(subjectID)
	if !ok {
		http.Error(w, "subject not found", http.StatusNotFound)
		return
	}
	if err := s.Keys.EnsureTenant(tenant); err != nil {
		if s.Keys.IsShredded(tenant) {
			http.Error(w, "tenant keys shredded", http.StatusGone)
			return
		}
		http.Error(w, "key custody error", http.StatusInternalServerError)
		return
	}

	decision, err := s.PEP.Evaluate(ctx, pep.PolicyInput{
		SubjectID:             subjectID,
		HomeJurisdiction:      sub.HomeJurisdiction,
		RequesterJurisdiction: requester,
		Purpose:               purpose,
		ConsentResearch:       sub.ConsentResearch,
		CrossBloc:             crossBloc,
		CrossBlocPermitted:    crossPermitted,
	})
	if err != nil {
		http.Error(w, "policy error", http.StatusBadGateway)
		return
	}

	pseudo := audit.Pseudonym(subjectID, tenant)
	if !decision.Allow {
		_ = s.Audit.Append(audit.Event{
			Action:                "patient.read",
			SubjectPseudonym:      pseudo,
			RequesterJurisdiction: requester,
			Purpose:               purpose,
			Outcome:               "deny",
			Detail:                decision.DenyReason,
		})
		writeJSON(w, http.StatusForbidden, map[string]any{
			"error":  "policy_denied",
			"reason": decision.DenyReason,
		})
		return
	}

	patient, err := s.FHIR.GetPatient(ctx, subjectID)
	if err != nil {
		http.Error(w, "fhir error", http.StatusBadGateway)
		return
	}
	filtered := fhir.FilterFields(patient, decision.MinNecessaryFields)

	enc, _ := s.Keys.Encrypt(tenant, subjectID)
	_ = s.Audit.Append(audit.Event{
		Action:                "patient.read",
		SubjectPseudonym:      pseudo,
		RequesterJurisdiction: requester,
		Purpose:               purpose,
		Outcome:               "allow",
		Detail:                "envelope_ref=" + enc[:16],
	})

	writeJSON(w, http.StatusOK, map[string]any{
		"patient":              filtered,
		"home_jurisdiction":    sub.HomeJurisdiction,
		"min_necessary_fields": decision.MinNecessaryFields,
	})
}

func (s *Server) ShredTenant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	tenant := r.URL.Query().Get("tenant")
	if tenant == "" {
		http.Error(w, "tenant required", http.StatusBadRequest)
		return
	}
	if err := s.Keys.ShredTenant(tenant); err != nil {
		http.Error(w, "shred failed", http.StatusInternalServerError)
		return
	}
	_ = s.Audit.Append(audit.Event{
		Action:  "tenant.crypto_shred",
		Outcome: "ok",
		Detail:  tenant,
	})
	writeJSON(w, http.StatusOK, map[string]string{"status": "shredded", "tenant": tenant})
}

func (s *Server) AITriage(w http.ResponseWriter, r *http.Request) {
	if s.AI == nil {
		http.Error(w, "ai governance unavailable", http.StatusServiceUnavailable)
		return
	}
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	out, err := s.AI.Triage(ctx, body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
