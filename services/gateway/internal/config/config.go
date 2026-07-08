package config

import (
	"os"

	"gopkg.in/yaml.v3"
)

type Routing struct {
	Jurisdictions map[string]Jurisdiction `yaml:"jurisdictions"`
	Tenants       map[string]Tenant       `yaml:"tenants"`
	Subjects      map[string]Subject      `yaml:"subjects"`
}

type Jurisdiction struct {
	Cell     string `yaml:"cell"`
	FHIRBase string `yaml:"fhir_base"`
}

type Tenant struct {
	HomeJurisdiction string `yaml:"home_jurisdiction"`
}

type Subject struct {
	Tenant           string `yaml:"tenant"`
	HomeJurisdiction string `yaml:"home_jurisdiction"`
	ConsentResearch  bool   `yaml:"consent_research"`
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

func (r *Routing) ResolveSubject(subjectID string) (Subject, Jurisdiction, string, bool) {
	sub, ok := r.Subjects[subjectID]
	if !ok {
		return Subject{}, Jurisdiction{}, "", false
	}
	j, ok := r.Jurisdictions[sub.HomeJurisdiction]
	if !ok {
		return Subject{}, Jurisdiction{}, "", false
	}
	tenant := sub.Tenant
	return sub, j, tenant, true
}
