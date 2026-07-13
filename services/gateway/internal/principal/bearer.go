package principal

import (
	"crypto/subtle"
	"strings"
)

// Authenticator validates caller credentials for one jurisdiction cell.
type Authenticator interface {
	Cell() string
	Kind() string
	Required() bool
	Authenticate(authHeader string) (Principal, bool)
}

type association struct {
	secret             string
	jurisdiction       string
	crossBlocPermitted bool
}

// BearerAuth validates `Authorization: Bearer <client_id>.<secret>` for a cell.
type BearerAuth struct {
	cell         string
	kind         string
	required     bool
	associations map[string]association
}

func NewBearerAuth(cell, kind string, required bool, associations map[string]association) *BearerAuth {
	if associations == nil {
		associations = map[string]association{}
	}
	return &BearerAuth{cell: cell, kind: kind, required: required, associations: associations}
}

func (b *BearerAuth) Cell() string { return b.cell }
func (b *BearerAuth) Kind() string { return b.kind }
func (b *BearerAuth) Required() bool {
	return b != nil && b.required
}

func (b *BearerAuth) Authenticate(authHeader string) (Principal, bool) {
	if b == nil || !b.required {
		return Principal{}, false
	}
	const prefix = "Bearer "
	if !strings.HasPrefix(authHeader, prefix) {
		return Principal{}, false
	}
	token := strings.TrimSpace(strings.TrimPrefix(authHeader, prefix))
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return Principal{}, false
	}
	clientID, secret := parts[0], parts[1]
	assoc, ok := b.associations[clientID]
	if !ok || !secretMatch(assoc.secret, secret) {
		return Principal{}, false
	}
	if strings.TrimSpace(assoc.jurisdiction) == "" {
		return Principal{}, false
	}
	return Principal{
		ClientID:           clientID,
		Jurisdiction:       assoc.jurisdiction,
		Cell:               b.cell,
		CrossBlocPermitted: assoc.crossBlocPermitted,
		AuthKind:           b.kind,
	}, true
}

func secretMatch(expected, actual string) bool {
	if len(expected) != len(actual) {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(expected), []byte(actual)) == 1
}
