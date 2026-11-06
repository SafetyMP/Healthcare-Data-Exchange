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

// SelectTEFCAXP chooses the Exchange Purpose sent to OPA.
// An explicit X-TEFCA-XP is forwarded unchanged so policy can reject a purpose
// the principal is not allowed to use. When the header is empty, a US-home
// default is used only if that code is in allowed; otherwise the XP stays empty
// so a caller is not handed a TEFCA purpose they cannot assert.
func SelectTEFCAXP(header, purpose, homeJurisdiction string, allowed []string) string {
	if strings.TrimSpace(header) != "" {
		return ResolveTEFCAXP(header, purpose, homeJurisdiction)
	}
	derived := ResolveTEFCAXP("", purpose, homeJurisdiction)
	if derived == "" || !containsXP(allowed, derived) {
		return ""
	}
	return derived
}

func containsXP(allowed []string, xp string) bool {
	for _, code := range allowed {
		if code == xp {
			return true
		}
	}
	return false
}
