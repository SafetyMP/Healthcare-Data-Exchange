"""Cloud Healthcare Exchange — identity broker service (ADR 0010).

ITI-78-style preferred-identifier lookup returning routing tokens only (no PHI).
Replaces static identifier maps in routing.yaml for runtime resolution; gateway
falls back to config when this service is unreachable.
"""

from __future__ import annotations

import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import yaml
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Cloud Healthcare Exchange Identity Broker", version="0.1.0")

_identifiers: dict[str, dict[str, str]] = {}
_subjects: dict[str, dict[str, str]] = {}


def _load_registry(path: Path) -> None:
    global _identifiers, _subjects
    data = yaml.safe_load(path.read_text()) or {}
    _identifiers = dict(data.get("identifiers") or {})
    _subjects = dict(data.get("subjects") or {})


@app.on_event("startup")
def startup() -> None:
    registry = os.getenv("CHEX_IDENTITY_REGISTRY", "/workspace/config/identity-registry.yaml")
    _load_registry(Path(registry))


class RegisterIdentifier(BaseModel):
    identifier: str = Field(min_length=3)
    subject: str
    home_jurisdiction: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "identity-broker"}


@app.get("/v1/resolve")
def resolve(identifier: str = "", subject: str = "") -> dict[str, Any]:
    """ITI-78-style resolve: preferred identifier or subject → routing token."""
    if identifier:
        ref = _identifiers.get(identifier)
        if ref is None:
            raise HTTPException(status_code=404, detail="identifier not found")
        return {
            "lookup": "identifier",
            "identifier": identifier,
            "subject": ref["subject"],
            "home_jurisdiction": ref["home_jurisdiction"],
            "resolved_at": datetime.now(UTC).isoformat(),
        }

    if subject:
        ref = _subjects.get(subject)
        if ref is None:
            raise HTTPException(status_code=404, detail="subject not found")
        return {
            "lookup": "subject",
            "subject": subject,
            "home_jurisdiction": ref["home_jurisdiction"],
            "resolved_at": datetime.now(UTC).isoformat(),
        }

    raise HTTPException(status_code=400, detail="identifier or subject required")


@app.post("/v1/identifiers")
def register_identifier(body: RegisterIdentifier) -> dict[str, Any]:
    """Register a preferred identifier (demo/admin — production would use NCP federation)."""
    _identifiers[body.identifier] = {
        "subject": body.subject,
        "home_jurisdiction": body.home_jurisdiction,
    }
    _subjects.setdefault(body.subject, {"home_jurisdiction": body.home_jurisdiction})
    return {
        "identifier": body.identifier,
        "subject": body.subject,
        "home_jurisdiction": body.home_jurisdiction,
        "registered_at": datetime.now(UTC).isoformat(),
    }
