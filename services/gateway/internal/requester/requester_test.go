package requester

import "testing"

func TestSelectTEFCAXP(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name, header, purpose, home string
		allowed                     []string
		want                        string
	}{
		{"header_forwarded_even_if_not_granted", "T-IAS", "treatment", "us-home", []string{"T-TREAT"}, "T-IAS"},
		{"derived_when_granted", "", "treatment", "us-home", []string{"T-TREAT"}, "T-TREAT"},
		{"derived_dropped_when_not_granted", "", "treatment", "us-home", nil, ""},
		{"eu_stays_empty", "", "treatment", "eu-home", []string{"T-TREAT"}, ""},
	}
	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			got := SelectTEFCAXP(tc.header, tc.purpose, tc.home, tc.allowed)
			if got != tc.want {
				t.Fatalf("SelectTEFCAXP=%q want %q", got, tc.want)
			}
		})
	}
}

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
