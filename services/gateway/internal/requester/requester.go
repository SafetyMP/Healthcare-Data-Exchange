package requester

import (
	"strings"

	appconfig "github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/config"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/ssraa"
)

// Context carries requester jurisdiction derived from verified credentials.
type Context struct {
	Jurisdiction       string
	CrossBloc          bool
	CrossBlocPermitted bool
}

// Resolve derives OPA inputs from routing + verified SSRAA credentials.
// Query params must not override jurisdiction or cross-bloc flags.
func Resolve(
	routing *appconfig.Routing,
	homeJurisdiction string,
	ssraa *ssraa.Validator,
	ssraaClientID string,
) Context {
	requester := homeJurisdiction
	if ssraaClientID != "" && ssraa != nil {
		if j, ok := ssraa.Jurisdiction(ssraaClientID); ok {
			requester = j
		}
	}
	crossBloc := false
	if routing != nil {
		crossBloc = routing.IsCrossBloc(requester, homeJurisdiction)
	}
	return Context{
		Jurisdiction:       requester,
		CrossBloc:          crossBloc,
		CrossBlocPermitted: false,
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
