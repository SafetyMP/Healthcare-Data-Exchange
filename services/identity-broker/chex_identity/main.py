"""Cloud Healthcare Exchange — identity broker service (ADR 0010).

ITI-78-style preferred-identifier lookup returning routing tokens only (no PHI).
Replaces static identifier maps in routing.yaml for runtime resolution; gateway
falls back to config when this service is unreachable.
"""

from __future__ import annotations

import hmac
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import yaml
from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

app = FastAPI(title="Cloud Healthcare Exchange Identity Broker", version="0.1.0")
_bearer = HTTPBearer(auto_error=False)


def _admin_secret() -> str:
    return os.environ.get("CHEX_ADMIN_SECRET", "").strip()


def require_identity_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> None:
    """ITI-78 lookups and identifier registration are authenticated (IHE PDQm)."""
    secret = _admin_secret()
    if not secret:
        raise HTTPException(status_code=503, detail="admin authentication not configured")
    token = credentials.credentials if credentials else ""
    if not hmac.compare_digest(token, secret):
        raise HTTPException(status_code=401, detail="admin authentication required")

_identifiers: dict[str, dict[str, str]] = {}
_subjects: dict[str, dict[str, str]] = {}


def _load_registry(path: Path) -> None:
    global _identifiers, _subjects
    data = yaml.safe_load(path.read_text()) or {}
    _identifiers = dict(data.get("identifiers") or {})
    _subjects = dict(data.get("subjects") or {})


@app.on_event("startup")
def startup() -> None:
    if not _admin_secret():
        raise RuntimeError("CHEX_ADMIN_SECRET must be set for the identity broker")
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
def resolve(
    identifier: str = "",
    subject: str = "",
    _: None = Depends(require_identity_auth),
) -> dict[str, Any]:
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
def register_identifier(
    body: RegisterIdentifier,
    _: None = Depends(require_identity_auth),
) -> dict[str, Any]:
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
