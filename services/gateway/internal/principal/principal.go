package principal

// Principal is a verified caller identity used to derive OPA inputs.
// Jurisdiction and cross-bloc flags come from the credential — never query params.
type Principal struct {
	ClientID           string
	Jurisdiction       string
	Cell               string
	CrossBlocPermitted bool
	AuthKind           string // e.g. "eu-bearer", "us-ssraa"
}
