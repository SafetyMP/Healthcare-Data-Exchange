package requester

import (
	"strings"

	appconfig "github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/config"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/principal"
)

// Context carries requester jurisdiction derived from a verified principal.
type Context struct {
	Jurisdiction       string
	CrossBloc          bool
	CrossBlocPermitted bool
}

// Resolve derives OPA inputs from routing + verified caller principal.
func Resolve(routing *appconfig.Routing, homeJurisdiction string, p principal.Principal) Context {
	crossBloc := false
	if routing != nil {
		crossBloc = routing.IsCrossBloc(p.Jurisdiction, homeJurisdiction)
	}
	return Context{
		Jurisdiction:       p.Jurisdiction,
		CrossBloc:          crossBloc,
		CrossBlocPermitted: p.CrossBlocPermitted,
	}
}

// NormalizePurpose trims and defaults clinical purpose.
func NormalizePurpose(purpose string) string {
	purpose = strings.TrimSpace(purpose)
	if purpose == "" {
		return "treatment"
	}
	return purpose
}
