package requester

import "testing"

func TestResolveTEFCAXP(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name, header, purpose, home, want string
	}{
		{"header_wins", "T-IAS", "treatment", "us-home", "T-IAS"},
		{"us_treatment_default", "", "treatment", "us-home", "T-TREAT"},
		{"us_derivative_default", "", "derivative", "us-home", "T-HCO"},
		{"us_research_empty", "", "research", "us-home", ""},
		{"eu_no_default", "", "treatment", "eu-home", ""},
		{"bogus_header_passthrough", "T-BOGUS", "treatment", "us-home", "T-BOGUS"},
	}
	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			got := ResolveTEFCAXP(tc.header, tc.purpose, tc.home)
			if got != tc.want {
				t.Fatalf("ResolveTEFCAXP(%q,%q,%q)=%q want %q", tc.header, tc.purpose, tc.home, got, tc.want)
			}
		})
	}
}
