// Command xpcheck is the installable exchange job without Compose.
// A caller-supplied TEFCA purpose is forwarded so policy can reject it when
// the principal was not granted that code. A failed Patient read is a
// fhir.StatusError, not a sample Patient.
package main

import (
	"fmt"
	"os"

	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/fhir"
	"github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/requester"
)

func main() {
	asserted := requester.SelectTEFCAXP("T-IAS", "treatment", "us-home", []string{"T-TREAT"})
	granted := requester.SelectTEFCAXP("", "treatment", "us-home", []string{"T-TREAT"})
	withheld := requester.SelectTEFCAXP("", "treatment", "us-home", []string{"T-HCO"})
	missing := &fhir.StatusError{StatusCode: 404}
	if asserted != "T-IAS" || granted != "T-TREAT" || withheld != "" || missing.StatusCode != 404 {
		fmt.Fprintf(os.Stderr, "xpcheck: asserted=%q granted=%q withheld=%q\n", asserted, granted, withheld)
		os.Exit(1)
	}
	fmt.Printf("asserted=%s granted=%s withheld=%q notFound=%d\n", asserted, granted, withheld, missing.StatusCode)
}
