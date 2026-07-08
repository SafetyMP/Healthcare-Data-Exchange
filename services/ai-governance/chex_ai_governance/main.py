"""Cloud Healthcare Exchange — AI governance stub (ADR 0005)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Cloud Healthcare Exchange AI Governance", version="0.1.0")


class ModelRegistration(BaseModel):
    model_id: str
    name: str
    risk_class: str = Field(description="e.g. high-risk Annex III")
    intended_use: str


class TriageRequest(BaseModel):
    subject_pseudonym: str
    features: dict[str, Any] = Field(default_factory=dict)


class DecisionRecord(BaseModel):
    decision_id: str
    model_id: str
    status: str
    score: float
    explanation: str
    art50_transparency: bool = True
    human_oversight_required: bool = True


_models: dict[str, ModelRegistration] = {}
_decisions: dict[str, DecisionRecord] = {}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-governance"}


@app.post("/v1/models")
def register_model(body: ModelRegistration) -> ModelRegistration:
    _models[body.model_id] = body
    return body


@app.get("/v1/models/{model_id}")
def get_model(model_id: str) -> ModelRegistration:
    model = _models.get(model_id)
    if model is None:
        raise HTTPException(status_code=404, detail="model not found")
    return model


@app.post("/v1/triage")
def triage(body: TriageRequest) -> dict[str, Any]:
    model_id = "triage-stub-v1"
    if model_id not in _models:
        _models[model_id] = ModelRegistration(
            model_id=model_id,
            name="EU Triage Stub",
            risk_class="high-risk-annex-iii",
            intended_use="clinical triage assistance",
        )
    decision_id = str(uuid.uuid4())
    record = DecisionRecord(
        decision_id=decision_id,
        model_id=model_id,
        status="pending_human_oversight",
        score=0.72,
        explanation="Stub model: elevated risk score for demo",
        art50_transparency=True,
        human_oversight_required=True,
    )
    _decisions[decision_id] = record
    return {
        "decision_id": decision_id,
        "status": record.status,
        "score": record.score,
        "explanation": record.explanation,
        "art50_transparency": record.art50_transparency,
        "human_oversight_required": record.human_oversight_required,
        "logged_at": datetime.now(UTC).isoformat(),
    }


@app.post("/v1/decisions/{decision_id}/approve")
def approve_decision(decision_id: str) -> dict[str, Any]:
    record = _decisions.get(decision_id)
    if record is None:
        raise HTTPException(status_code=404, detail="decision not found")
    record.status = "approved"
    _decisions[decision_id] = record
    return {"decision_id": decision_id, "status": "approved"}


@app.post("/v1/decisions/{decision_id}/reject")
def reject_decision(decision_id: str) -> dict[str, Any]:
    record = _decisions.get(decision_id)
    if record is None:
        raise HTTPException(status_code=404, detail="decision not found")
    record.status = "rejected"
    _decisions[decision_id] = record
    return {"decision_id": decision_id, "status": "rejected"}
