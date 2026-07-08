package ssraa

import (
	"fmt"
	"os"
	"strings"

	"gopkg.in/yaml.v3"
)

// Config holds registered SSRAA application associations (ADR 0009 stub).
type Config struct {
	Required     bool                   `yaml:"required"`
	Associations map[string]Association `yaml:"associations"`
}

type Association struct {
	Secret string   `yaml:"secret"`
	Scopes []string `yaml:"scopes"`
}

func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}
	if cfg.Associations == nil {
		cfg.Associations = map[string]Association{}
	}
	return &cfg, nil
}

// Validator checks SSRAA-shaped bearer credentials for US-cell FHIR access.
type Validator struct {
	cfg *Config
}

func NewValidator(cfg *Config) *Validator {
	return &Validator{cfg: cfg}
}

// Required reports whether US-cell reads must present SSRAA credentials.
func (v *Validator) Required() bool {
	return v != nil && v.cfg != nil && v.cfg.Required
}

// Validate parses `Authorization: Bearer <client_id>.<secret>` and checks registration.
func (v *Validator) Validate(authHeader string) (clientID string, ok bool) {
	if v == nil || v.cfg == nil || !v.cfg.Required {
		return "", true
	}
	const prefix = "Bearer "
	if !strings.HasPrefix(authHeader, prefix) {
		return "", false
	}
	token := strings.TrimSpace(strings.TrimPrefix(authHeader, prefix))
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return "", false
	}
	clientID, secret := parts[0], parts[1]
	assoc, ok := v.cfg.Associations[clientID]
	if !ok || assoc.Secret != secret {
		return "", false
	}
	return clientID, true
}

func (v *Validator) String() string {
	if v == nil || v.cfg == nil {
		return "ssraa:disabled"
	}
	return fmt.Sprintf("ssraa:required=%v associations=%d", v.cfg.Required, len(v.cfg.Associations))
}
