package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/adminauth"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/audit"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/broker"
	appconfig "github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/config"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/crypto"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/fhir"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/pep"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/principal"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/requester"
)

type PolicyEvaluator interface {
	Evaluate(ctx context.Context, input pep.PolicyInput) (pep.Decision, error)
}

type AIGovernance interface {
	Triage(ctx context.Context, payload map[string]any) (map[string]any, error)
}

type ConsentAdmin interface {
	Set(ctx context.Context, subject, action, purpose, adminAuth string) (map[string]any, int, error)
}

type Server struct {
	Routing        *appconfig.Routing
	Broker         *broker.Broker
	PEP            PolicyEvaluator
	FHIR           *fhir.Client
	Audit          *audit.Sink
	Keys           *crypto.KeyStore
	AI             AIGovernance
	Consent        ConsentAdmin
	Principals     *principal.Broker
	ClinicianUIURL string
}

func (s *Server) Health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "gateway"})
}

func (s *Server) GetPatient(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	subjectID := strings.TrimPrefix(r.URL.Path, "/v1/patients/")
	subjectID = strings.Trim(subjectID, "/")
	identifier := r.URL.Query().Get("identifier")
	if subjectID == "" && identifier == "" {
		http.Error(w, "missing patient id or identifier", http.StatusBadRequest)
		return
	}

	purpose := requester.NormalizePurpose(r.URL.Query().Get("purpose"))

	token, ok := s.Broker.Resolve(ctx, subjectID, identifier)
	if !ok {
		http.Error(w, "subject not found", http.StatusNotFound)
		return
	}

	if s.Principals == nil {
		http.Error(w, "caller authentication not configured", http.StatusServiceUnavailable)
		return
	}
	caller, ok := s.Principals.Authenticate(r.Header.Get("Authorization"))
	if !ok {
		if err := s.auditAppend(audit.Event{
			Action:                "patient.read",
			RequesterJurisdiction: "",
			Purpose:               purpose,
			Outcome:               "deny",
			Detail:                "caller_unauthenticated",
		}); err != nil {
			http.Error(w, "audit error", http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusUnauthorized, map[string]any{
			"error":  s.Principals.DenyReason(token.Cell),
			"reason": "invalid_or_missing_association",
		})
		return
	}

	reqCtx := requester.Resolve(s.Routing, token.HomeJurisdiction, caller)
	requesterJurisdiction := reqCtx.Jurisdiction
	crossBloc := reqCtx.CrossBloc
	crossPermitted := reqCtx.CrossBlocPermitted

	if err := s.Keys.EnsureTenant(token.Tenant); err != nil {
		if s.Keys.IsShredded(token.Tenant) {
			http.Error(w, "tenant keys shredded", http.StatusGone)
			return
		}
		http.Error(w, "key custody error", http.StatusInternalServerError)
		return
	}

	decision, err := s.PEP.Evaluate(ctx, pep.PolicyInput{
		SubjectID:             token.SubjectID,
		HomeJurisdiction:      token.HomeJurisdiction,
		RequesterJurisdiction: requesterJurisdiction,
		Purpose:               purpose,
		ConsentResearch:       token.ConsentResearch,
		CrossBloc:             crossBloc,
		CrossBlocPermitted:    crossPermitted,
	})
	if err != nil {
		http.Error(w, "policy error", http.StatusBadGateway)
		return
	}

	pseudo, err := s.Keys.Pseudonym(token.Tenant, token.SubjectID)
	if err != nil {
		http.Error(w, "key custody error", http.StatusInternalServerError)
		return
	}
	if !decision.Allow {
		if err := s.auditAppend(audit.Event{
			Action:                "patient.read",
			SubjectPseudonym:      pseudo,
			RequesterJurisdiction: requesterJurisdiction,
			Purpose:               purpose,
			Outcome:               "deny",
			Detail:                decision.DenyReason,
		}); err != nil {
			http.Error(w, "audit error", http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusForbidden, map[string]any{
			"error":  "policy_denied",
			"reason": decision.DenyReason,
		})
		return
	}

	patient, err := s.FHIR.GetPatientForCell(ctx, token.SubjectID, token.Cell, token.FHIRBase)
	if err != nil {
		http.Error(w, "fhir error", http.StatusBadGateway)
		return
	}
	filtered := fhir.FilterFields(patient, decision.MinNecessaryFields)

	enc, err := s.Keys.Encrypt(token.Tenant, token.SubjectID)
	if err != nil {
		http.Error(w, "key custody error", http.StatusInternalServerError)
		return
	}
	envelopeRef := enc
	if len(enc) > 16 {
		envelopeRef = enc[:16]
	}
	if err := s.auditAppend(audit.Event{
		Action:                "patient.read",
		SubjectPseudonym:      pseudo,
		RequesterJurisdiction: requesterJurisdiction,
		Purpose:               purpose,
		Outcome:               "allow",
		Detail:                "envelope_ref=" + envelopeRef,
	}); err != nil {
		http.Error(w, "audit error", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"patient":                filtered,
		"subject":                token.SubjectID,
		"home_jurisdiction":      token.HomeJurisdiction,
		"home_cell":              token.Cell,
		"routed_fhir_base":       token.FHIRBase,
		"requester_jurisdiction": requesterJurisdiction,
		"cross_bloc":             crossBloc,
		"min_necessary_fields":   decision.MinNecessaryFields,
	})
}

// ResolveIdentity exposes identity broker resolution (routing token only, no PHI).
func (s *Server) ResolveIdentity(w http.ResponseWriter, r *http.Request) {
	subjectID := r.URL.Query().Get("subject")
	identifier := r.URL.Query().Get("identifier")
	if subjectID == "" && identifier == "" {
		http.Error(w, "subject or identifier required", http.StatusBadRequest)
		return
	}

	token, ok := s.Broker.Resolve(r.Context(), subjectID, identifier)
	if !ok {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"subject":           token.SubjectID,
		"home_jurisdiction": token.HomeJurisdiction,
		"cell":              token.Cell,
		"tenant":            token.Tenant,
	})
}

func (s *Server) ShredTenant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !adminauth.Authorize(r.Header.Get("Authorization")) {
		adminauth.Deny(w)
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
	if err := s.auditAppend(audit.Event{
		Action:  "tenant.crypto_shred",
		Outcome: "ok",
		Detail:  tenant,
	}); err != nil {
		http.Error(w, "audit error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "shredded", "tenant": tenant})
}

// ConsentAdmin grants or revokes consent via the consent-service, which syncs
// the change to the PDP through OPAL (ADR 0008). Single entry point via gateway.
func (s *Server) ConsentAdminHandler(w http.ResponseWriter, r *http.Request) {
	if s.Consent == nil {
		http.Error(w, "consent service unavailable", http.StatusServiceUnavailable)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	adminAuth := r.Header.Get("Authorization")
	if !adminauth.Authorize(adminAuth) {
		adminauth.Deny(w)
		return
	}
	subject := r.URL.Query().Get("subject")
	action := r.URL.Query().Get("action")
	purpose := r.URL.Query().Get("purpose")
	if purpose == "" {
		purpose = "research"
	}
	if subject == "" || action == "" {
		http.Error(w, "subject and action required", http.StatusBadRequest)
		return
	}
	out, status, err := s.Consent.Set(r.Context(), subject, action, purpose, adminAuth)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	if err := s.auditAppend(audit.Event{
		Action:  "consent." + action,
		Outcome: "ok",
		Detail:  subject + ":" + purpose,
	}); err != nil {
		http.Error(w, "audit error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, status, out)
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

func (s *Server) auditAppend(ev audit.Event) error {
	if s.Audit == nil {
		return nil
	}
	return s.Audit.Append(ev)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
