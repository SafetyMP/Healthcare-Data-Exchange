from fastapi.testclient import TestClient

from chex_ai_governance.main import app

client = TestClient(app)


def test_health() -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["service"] == "ai-governance"


def test_triage_requires_human_oversight() -> None:
    resp = client.post(
        "/v1/triage",
        json={"subject_pseudonym": "abc123", "features": {"age": 45}},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["human_oversight_required"] is True
    assert body["art50_transparency"] is True
    assert body["status"] == "pending_human_oversight"

    decision_id = body["decision_id"]
    approve = client.post(f"/v1/decisions/{decision_id}/approve")
    assert approve.status_code == 200
    assert approve.json()["status"] == "approved"
