package principal

// Principal is a verified caller identity used to derive OPA inputs.
// Jurisdiction and cross-bloc flags come from the credential — never query params.
type Principal struct {
	ClientID           string
	Jurisdiction       string
	Cell               string
	CrossBlocPermitted bool
	AuthKind           string // e.g. "eu-bearer", "us-ssraa"
	// AllowedTEFCAXP is the Exchange Purpose set this bearer may assert.
	AllowedTEFCAXP []string
	// RequiresTEFCAXP means an empty Exchange Purpose must not satisfy xp_ok.
	RequiresTEFCAXP bool
}
