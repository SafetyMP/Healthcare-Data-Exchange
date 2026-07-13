package principal

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

// CellFile is the shared YAML shape for per-cell bearer credential registries.
type CellFile struct {
	Required     bool                       `yaml:"required"`
	Associations map[string]CellAssociation `yaml:"associations"`
}

type CellAssociation struct {
	Secret             string   `yaml:"secret"`
	Scopes             []string `yaml:"scopes"`
	Jurisdiction       string   `yaml:"jurisdiction"`
	CrossBlocPermitted bool     `yaml:"cross_bloc_permitted"`
}

func LoadCellFile(path string) (*CellFile, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var cfg CellFile
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}
	if cfg.Associations == nil {
		cfg.Associations = map[string]CellAssociation{}
	}
	return &cfg, nil
}

func bearerAuthFromFile(cell, kind, path string) (*BearerAuth, error) {
	cfg, err := LoadCellFile(path)
	if err != nil {
		return nil, err
	}
	assocs := make(map[string]association, len(cfg.Associations))
	for id, a := range cfg.Associations {
		assocs[id] = association{
			secret:             a.Secret,
			jurisdiction:       a.Jurisdiction,
			crossBlocPermitted: a.CrossBlocPermitted,
		}
	}
	return NewBearerAuth(cell, kind, cfg.Required, assocs), nil
}

// Broker routes authentication to the correct per-cell validator.
type Broker struct {
	auths []Authenticator
}

// NewBroker loads EU bearer auth and US SSRAA registries from separate config files.
func NewBroker(euAuthPath, ssraaPath string) (*Broker, error) {
	eu, err := bearerAuthFromFile("eu", "eu-bearer", euAuthPath)
	if err != nil {
		return nil, fmt.Errorf("eu auth: %w", err)
	}
	us, err := bearerAuthFromFile("us", "us-ssraa", ssraaPath)
	if err != nil {
		return nil, fmt.Errorf("us ssraa: %w", err)
	}
	if !eu.Required() || !us.Required() {
		return nil, fmt.Errorf("both eu-auth and ssraa must set required: true")
	}
	return &Broker{auths: []Authenticator{eu, us}}, nil
}

// NewBrokerFromAuthenticators is for tests.
func NewBrokerFromAuthenticators(auths ...Authenticator) *Broker {
	return &Broker{auths: auths}
}

func (b *Broker) Authenticate(authHeader string) (Principal, bool) {
	if b == nil {
		return Principal{}, false
	}
	for _, a := range b.auths {
		if p, ok := a.Authenticate(authHeader); ok {
			return p, true
		}
	}
	return Principal{}, false
}

// DenyReason returns the API error reason when authentication fails for a subject home cell.
func (b *Broker) DenyReason(subjectCell string) string {
	if subjectCell == "us" {
		return "ssraa_required"
	}
	return "credential_required"
}

func (b *Broker) String() string {
	if b == nil {
		return "principal:disabled"
	}
	return fmt.Sprintf("principal:cells=%d", len(b.auths))
}
