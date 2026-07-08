package chex.authz_test

import data.chex.authz

# Consent data as OPAL would sync it into OPA at data.consent.
consent_data := {
	"patient-eu-001": {"research": false},
	"patient-eu-002": {"research": true},
	"patient-us-001": {"research": false},
	"patient-us-002": {"research": true},
}

test_intra_eu_treatment_allowed {
	authz.allow with input as {
		"subject_id": "patient-eu-001",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "eu-visiting",
		"purpose": "treatment",
		"cross_bloc": false,
	}
		with data.consent as consent_data
}

test_research_denied_without_consent {
	not authz.allow with input as {
		"subject_id": "patient-eu-001",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "eu-home",
		"purpose": "research",
		"cross_bloc": false,
	}
		with data.consent as consent_data
}

test_research_allowed_with_consent {
	authz.allow with input as {
		"subject_id": "patient-eu-002",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "eu-home",
		"purpose": "research",
		"cross_bloc": false,
	}
		with data.consent as consent_data
}

# Same subject, consent revoked in synced data → research now denied (ADR 0007).
test_research_denied_after_revocation {
	not authz.allow with input as {
		"subject_id": "patient-eu-002",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "eu-home",
		"purpose": "research",
		"cross_bloc": false,
	}
		with data.consent as {"patient-eu-002": {"research": false}}
}

test_research_denied_when_no_consent_record {
	not authz.allow with input as {
		"subject_id": "patient-unknown",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "eu-home",
		"purpose": "research",
		"cross_bloc": false,
	}
		with data.consent as consent_data
}

test_intra_us_treatment_allowed {
	authz.allow with input as {
		"subject_id": "patient-us-001",
		"home_jurisdiction": "us-home",
		"requester_jurisdiction": "us-clinician",
		"purpose": "treatment",
		"cross_bloc": false,
	}
		with data.consent as consent_data
}

test_cross_bloc_default_denied {
	not authz.allow with input as {
		"subject_id": "patient-eu-001",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "us-clinician",
		"purpose": "treatment",
		"cross_bloc": true,
		"cross_bloc_permitted": false,
	}
		with data.consent as consent_data
}

test_us_to_eu_treatment_denied_even_if_cross_bloc_permitted {
	not authz.allow with input as {
		"subject_id": "patient-eu-001",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "us-clinician",
		"purpose": "treatment",
		"cross_bloc": true,
		"cross_bloc_permitted": true,
	}
		with data.consent as consent_data
}

test_cross_bloc_derivative_exception {
	authz.allow with input as {
		"subject_id": "patient-eu-001",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "us-clinician",
		"purpose": "derivative",
		"cross_bloc": true,
		"cross_bloc_permitted": true,
	}
		with data.consent as consent_data
}

test_cross_bloc_derivative_exception_labeled {
	authz.exception_label == "cross_bloc_derivative" with input as {
		"subject_id": "patient-eu-001",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "us-clinician",
		"purpose": "derivative",
		"cross_bloc": true,
		"cross_bloc_permitted": true,
	}
		with data.consent as consent_data
}

test_cross_bloc_treatment_has_no_exception_label {
	authz.exception_label == "" with input as {
		"subject_id": "patient-eu-001",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "us-clinician",
		"purpose": "treatment",
		"cross_bloc": true,
		"cross_bloc_permitted": true,
	}
		with data.consent as consent_data
}

test_cross_bloc_derivative_minimum_fields {
	authz.min_necessary_fields == ["id", "resourceType"] with input as {
		"subject_id": "patient-eu-001",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "us-clinician",
		"purpose": "derivative",
		"cross_bloc": true,
		"cross_bloc_permitted": true,
	}
		with data.consent as consent_data
}
