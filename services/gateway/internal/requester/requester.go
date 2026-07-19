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

// ResolveTEFCAXP returns the TEFCA Exchange Purpose code for OPA.
// Explicit X-TEFCA-XP wins; for US-home subjects, purpose maps to a Level-1 XP
// when the header is absent (treatment→T-TREAT, derivative→T-HCO).
func ResolveTEFCAXP(header, purpose, homeJurisdiction string) string {
	xp := strings.TrimSpace(header)
	if xp != "" {
		return xp
	}
	if !strings.HasPrefix(homeJurisdiction, "us-") {
		return ""
	}
	switch purpose {
	case "treatment":
		return "T-TREAT"
	case "derivative":
		return "T-HCO"
	default:
		return ""
	}
}
