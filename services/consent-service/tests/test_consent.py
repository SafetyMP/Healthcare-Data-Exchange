import os

# Keep unit tests network-free: never attempt a real OPAL publish.
os.environ["CHEX_OPAL_PUBLISH"] = "0"
os.environ["CHEX_ADMIN_SECRET"] = "test-admin-secret"

from fastapi.testclient import TestClient  # noqa: E402

from chex_consent.main import app  # noqa: E402

client = TestClient(app)
ADMIN_HEADERS = {"Authorization": "Bearer test-admin-secret"}


def test_health() -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["service"] == "consent"


def test_policy_data_is_full_consent_map() -> None:
    resp = client.get("/policy-data")
    assert resp.status_code == 200
    body = resp.json()
    assert body["patient-eu-002"]["research"] is True
    assert body["patient-eu-001"]["research"] is False


def test_revoke_then_grant_flips_state() -> None:
    revoke = client.post(
        "/v1/consent/patient-eu-002/revoke",
        params={"purpose": "research"},
        headers=ADMIN_HEADERS,
    )
    assert revoke.status_code == 200
    assert revoke.json()["consent"]["research"] is False
    assert client.get("/policy-data").json()["patient-eu-002"]["research"] is False

    grant = client.post(
        "/v1/consent/patient-eu-002/grant",
        params={"purpose": "research"},
        headers=ADMIN_HEADERS,
    )
    assert grant.status_code == 200
    assert grant.json()["consent"]["research"] is True
    assert client.get("/policy-data").json()["patient-eu-002"]["research"] is True


def test_consent_admin_requires_auth() -> None:
    resp = client.post("/v1/consent/patient-eu-001/revoke", params={"purpose": "research"})
    assert resp.status_code == 401


def test_unknown_action_rejected() -> None:
    resp = client.post(
        "/v1/consent/patient-eu-001/toggle",
        params={"purpose": "research"},
        headers=ADMIN_HEADERS,
    )
    assert resp.status_code == 400


def test_unsupported_purpose_rejected() -> None:
    resp = client.post(
        "/v1/consent/patient-eu-001/revoke",
        params={"purpose": "billing"},
        headers=ADMIN_HEADERS,
    )
    assert resp.status_code == 400


def test_missing_consent_record_is_404() -> None:
    resp = client.get("/v1/consent/patient-nope")
    assert resp.status_code == 404
