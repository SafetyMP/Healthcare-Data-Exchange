package chex.authz_test

import data.chex.authz

# Consent data as OPAL would sync it into OPA at data.consent.
consent_data := {
	"patient-eu-001": {"research": false, "treatment": true, "derivative": true},
	"patient-eu-002": {"research": true, "treatment": true, "derivative": true},
	"patient-us-001": {"research": false, "treatment": true, "derivative": true},
	"patient-us-002": {"research": true, "treatment": true, "derivative": true},
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

# Treatment is consent-gated. A research grant does not skip that check.
test_treatment_denied_without_treatment_consent {
	not authz.allow with input as {
		"subject_id": "patient-eu-002",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "eu-home",
		"purpose": "treatment",
		"cross_bloc": false,
	}
		with data.consent as {"patient-eu-002": {"research": true, "treatment": false}}
}

test_treatment_deny_reason_is_consent_required {
	authz.deny_reason == "consent_required" with input as {
		"subject_id": "patient-eu-002",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "eu-home",
		"purpose": "treatment",
		"cross_bloc": false,
	}
		with data.consent as {"patient-eu-002": {"research": true, "treatment": false}}
}

# A purpose string other than "research" must not skip consent.
test_purpose_string_does_not_skip_consent {
	not authz.allow with input as {
		"subject_id": "patient-eu-002",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "eu-home",
		"purpose": "billing",
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
		"tefca_xp": "T-TREAT",
		"allowed_tefca_xp": ["T-TREAT"],
		"cross_bloc": false,
	}
		with data.consent as consent_data
}

test_us_treatment_allowed_with_empty_xp {
	authz.allow with input as {
		"subject_id": "patient-us-001",
		"home_jurisdiction": "us-home",
		"requester_jurisdiction": "us-clinician",
		"purpose": "treatment",
		"cross_bloc": false,
	}
		with data.consent as consent_data
}

test_unknown_tefca_xp_denied {
	not authz.allow with input as {
		"subject_id": "patient-us-001",
		"home_jurisdiction": "us-home",
		"requester_jurisdiction": "us-clinician",
		"purpose": "treatment",
		"tefca_xp": "T-BOGUS",
		"cross_bloc": false,
	}
		with data.consent as consent_data
}

test_unknown_tefca_xp_deny_reason {
	authz.deny_reason == "xp_denied" with input as {
		"subject_id": "patient-us-001",
		"home_jurisdiction": "us-home",
		"requester_jurisdiction": "us-clinician",
		"purpose": "treatment",
		"tefca_xp": "T-BOGUS",
		"cross_bloc": false,
	}
		with data.consent as consent_data
}

test_tefca_ias_xp_allowed {
	authz.allow with input as {
		"subject_id": "patient-us-001",
		"home_jurisdiction": "us-home",
		"requester_jurisdiction": "us-clinician",
		"purpose": "treatment",
		"tefca_xp": "T-IAS",
		"allowed_tefca_xp": ["T-IAS"],
		"cross_bloc": false,
	}
		with data.consent as consent_data
}

# Globally valid T-IAS is denied when this principal was not granted it.
test_xp_denied_when_outside_principal_allowed_set {
	not authz.allow with input as {
		"subject_id": "patient-us-001",
		"home_jurisdiction": "us-home",
		"requester_jurisdiction": "us-clinician",
		"purpose": "treatment",
		"tefca_xp": "T-IAS",
		"allowed_tefca_xp": ["T-TREAT"],
		"cross_bloc": false,
	}
		with data.consent as consent_data
}

test_xp_outside_principal_set_deny_reason {
	authz.deny_reason == "xp_denied" with input as {
		"subject_id": "patient-us-001",
		"home_jurisdiction": "us-home",
		"requester_jurisdiction": "us-clinician",
		"purpose": "treatment",
		"tefca_xp": "T-IAS",
		"allowed_tefca_xp": ["T-TREAT"],
		"cross_bloc": false,
	}
		with data.consent as consent_data
}

# Treatment does not require research consent. Empty XP is denied only when
# the principal requires a TEFCA purpose.
test_empty_xp_denied_when_principal_requires_tefca_xp {
	not authz.allow with input as {
		"subject_id": "patient-us-001",
		"home_jurisdiction": "us-home",
		"requester_jurisdiction": "us-clinician",
		"purpose": "treatment",
		"tefca_xp": "",
		"requires_tefca_xp": true,
		"allowed_tefca_xp": ["T-TREAT"],
		"cross_bloc": false,
	}
		with data.consent as consent_data
}

test_empty_xp_deny_reason_when_principal_requires_tefca_xp {
	authz.deny_reason == "xp_denied" with input as {
		"subject_id": "patient-us-001",
		"home_jurisdiction": "us-home",
		"requester_jurisdiction": "us-clinician",
		"purpose": "treatment",
		"tefca_xp": "",
		"requires_tefca_xp": true,
		"allowed_tefca_xp": ["T-TREAT"],
		"cross_bloc": false,
	}
		with data.consent as consent_data
}

test_treatment_allowed_without_research_consent {
	authz.allow with input as {
		"subject_id": "patient-eu-001",
		"home_jurisdiction": "eu-home",
		"requester_jurisdiction": "eu-home",
		"purpose": "treatment",
		"tefca_xp": "",
		"requires_tefca_xp": false,
		"allowed_tefca_xp": [],
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
