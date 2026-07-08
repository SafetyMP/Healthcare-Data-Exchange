package config

import (
	"os"

	"gopkg.in/yaml.v3"
)

type Routing struct {
	Jurisdictions  map[string]Jurisdiction `yaml:"jurisdictions"`
	Tenants        map[string]Tenant       `yaml:"tenants"`
	IdentityBroker IdentityBroker          `yaml:"identity_broker"`
	Subjects       map[string]Subject      `yaml:"subjects"`
}

type Jurisdiction struct {
	Cell     string `yaml:"cell"`
	FHIRBase string `yaml:"fhir_base"`
}

type Tenant struct {
	HomeJurisdiction string `yaml:"home_jurisdiction"`
}

type IdentityBroker struct {
	Identifiers    map[string]IdentifierRef `yaml:"identifiers"`
	TenantDefaults bool                     `yaml:"tenant_defaults"`
}

type IdentifierRef struct {
	Subject          string `yaml:"subject"`
	HomeJurisdiction string `yaml:"home_jurisdiction"`
}

type Subject struct {
	Tenant           string `yaml:"tenant"`
	HomeJurisdiction string `yaml:"home_jurisdiction"`
	ConsentResearch  bool   `yaml:"consent_research"`
}

// RoutingToken is the broker output: jurisdiction + opaque subject reference (ADR 0006).
type RoutingToken struct {
	SubjectID        string
	HomeJurisdiction string
	Cell             string
	FHIRBase         string
	Tenant           string
	ConsentResearch  bool
}

func LoadRouting(path string) (*Routing, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var r Routing
	if err := yaml.Unmarshal(data, &r); err != nil {
		return nil, err
	}
	return &r, nil
}

// ResolveSubject resolves a subject ID to its home jurisdiction (legacy helper).
func (r *Routing) ResolveSubject(subjectID string) (Subject, Jurisdiction, string, bool) {
	token, ok := r.ResolveRouting(subjectID, "")
	if !ok {
		return Subject{}, Jurisdiction{}, "", false
	}
	sub := r.Subjects[subjectID]
	j := r.Jurisdictions[token.HomeJurisdiction]
	return sub, j, token.Tenant, true
}

// ResolveRouting resolves home jurisdiction from subject ID and/or preferred identifier.
// Identifier lookup takes precedence when provided (ITI-78-style stub).
func (r *Routing) ResolveRouting(subjectID, identifier string) (RoutingToken, bool) {
	if identifier != "" {
		if ref, ok := r.IdentityBroker.Identifiers[identifier]; ok {
			return r.tokenForSubject(ref.Subject, ref.HomeJurisdiction)
		}
	}
	if subjectID != "" {
		return r.tokenForSubject(subjectID, "")
	}
	return RoutingToken{}, false
}

// TokenForSubject builds a routing token from subject registry + jurisdiction map.
func (r *Routing) TokenForSubject(subjectID, overrideHome string) (RoutingToken, bool) {
	return r.tokenForSubject(subjectID, overrideHome)
}

func (r *Routing) tokenForSubject(subjectID, overrideHome string) (RoutingToken, bool) {
	sub, ok := r.Subjects[subjectID]
	if !ok {
		return RoutingToken{}, false
	}

	home := sub.HomeJurisdiction
	if overrideHome != "" {
		home = overrideHome
	}
	if home == "" && r.IdentityBroker.TenantDefaults {
		if tenant, ok := r.Tenants[sub.Tenant]; ok {
			home = tenant.HomeJurisdiction
		}
	}
	j, ok := r.Jurisdictions[home]
	if !ok {
		return RoutingToken{}, false
	}

	return RoutingToken{
		SubjectID:        subjectID,
		HomeJurisdiction: home,
		Cell:             j.Cell,
		FHIRBase:         j.FHIRBase,
		Tenant:           sub.Tenant,
		ConsentResearch:  sub.ConsentResearch,
	}, true
}

// JurisdictionCell returns the sovereignty cell for a jurisdiction key.
func (r *Routing) JurisdictionCell(jurisdiction string) (string, bool) {
	j, ok := r.Jurisdictions[jurisdiction]
	if !ok {
		return "", false
	}
	return j.Cell, true
}

// IsCrossBloc reports whether requester and home jurisdictions span different cells.
func (r *Routing) IsCrossBloc(requesterJurisdiction, homeJurisdiction string) bool {
	reqCell, ok := r.JurisdictionCell(requesterJurisdiction)
	if !ok {
		return false
	}
	homeCell, ok := r.JurisdictionCell(homeJurisdiction)
	if !ok {
		return false
	}
	return reqCell != homeCell
}
