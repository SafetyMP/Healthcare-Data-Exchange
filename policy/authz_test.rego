package chex.authz_test

import data.chex.authz

test_intra_eu_treatment_allowed {
	authz.allow with input as {
		"subject_id": "patient-eu-001",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "eu-visiting",
		"purpose": "treatment",
		"consent_research": false,
		"cross_bloc": false,
	}
}

test_research_denied_without_consent {
	not authz.allow with input as {
		"subject_id": "patient-eu-001",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "eu-home",
		"purpose": "research",
		"consent_research": false,
		"cross_bloc": false,
	}
}

test_research_allowed_with_consent {
	authz.allow with input as {
		"subject_id": "patient-eu-001",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "eu-home",
		"purpose": "research",
		"consent_research": true,
		"cross_bloc": false,
	}
}

test_cross_bloc_default_denied {
	not authz.allow with input as {
		"subject_id": "patient-eu-001",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "us-clinician",
		"purpose": "treatment",
		"consent_research": false,
		"cross_bloc": true,
		"cross_bloc_permitted": false,
	}
}

test_cross_bloc_derivative_exception {
	authz.allow with input as {
		"subject_id": "patient-eu-001",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "us-clinician",
		"purpose": "derivative",
		"consent_research": false,
		"cross_bloc": true,
		"cross_bloc_permitted": true,
	}
}
