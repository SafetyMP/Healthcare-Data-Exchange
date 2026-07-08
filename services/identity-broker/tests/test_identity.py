import os
from pathlib import Path

os.environ["CHEX_IDENTITY_REGISTRY"] = str(
    Path(__file__).resolve().parents[3] / "config" / "identity-registry.yaml"
)

from fastapi.testclient import TestClient  # noqa: E402

from chex_identity.main import app, startup  # noqa: E402

startup()
client = TestClient(app)


def test_health() -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["service"] == "identity-broker"


def test_resolve_tefca_identifier() -> None:
    resp = client.get("/v1/resolve", params={"identifier": "urn:tefca:patient:us-001"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["subject"] == "patient-us-001"
    assert body["home_jurisdiction"] == "us-home"
    assert body["lookup"] == "identifier"


def test_register_and_resolve_eu_identifier() -> None:
    reg = client.post(
        "/v1/identifiers",
        json={
            "identifier": "urn:ehds:patient:eu-002",
            "subject": "patient-eu-002",
            "home_jurisdiction": "eu-home",
        },
    )
    assert reg.status_code == 200

    resp = client.get("/v1/resolve", params={"identifier": "urn:ehds:patient:eu-002"})
    assert resp.status_code == 200
    assert resp.json()["subject"] == "patient-eu-002"
