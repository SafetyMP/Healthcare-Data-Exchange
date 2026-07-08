# Cloud Healthcare Exchange — authorization policy (OPA/Rego)
#
# Consent is NOT baked into this policy or the request input. It is synced as
# external data at `data.consent` by OPAL (ADR 0007), so revocation propagates
# to the PDP without a redeploy. Residency + purpose logic stays in git.
package chex.authz

import future.keywords.if
import future.keywords.in

default allow := false

default deny_reason := "policy_denied"

default exception_label := ""

allow if {
	consent_ok
	residency_ok
}

allow if {
	cross_bloc_derivative_exception
}

cross_bloc_derivative_exception if {
	consent_ok
	input.cross_bloc == true
	input.cross_bloc_permitted == true
	input.purpose == "derivative"
}

exception_label := "cross_bloc_derivative" if {
	cross_bloc_derivative_exception
}

# Research requires an active consent record synced via OPAL (data.consent).
# All other purposes (treatment, derivative) are consent-gated elsewhere.
consent_ok if {
	input.purpose != "research"
}

consent_ok if {
	input.purpose == "research"
	data.consent[input.subject_id].research == true
}

residency_ok if {
	input.requester_jurisdiction == input.home_jurisdiction
}

residency_ok if {
	eu_prefix(input.requester_jurisdiction)
	eu_prefix(input.home_jurisdiction)
	input.cross_bloc != true
}

residency_ok if {
	us_prefix(input.requester_jurisdiction)
	us_prefix(input.home_jurisdiction)
	input.cross_bloc != true
}

eu_prefix(j) if {
	startswith(j, "eu-")
}

us_prefix(j) if {
	startswith(j, "us-")
}

deny_reason := "consent_required" if {
	not consent_ok
}

deny_reason := "residency_denied" if {
	consent_ok
	not residency_ok
}

min_necessary_fields := ["id", "resourceType", "name", "birthDate", "gender"] if {
	allow
	not cross_bloc_derivative_exception
}

min_necessary_fields := ["id", "resourceType"] if {
	cross_bloc_derivative_exception
}

min_necessary_fields := [] if {
	not allow
}
