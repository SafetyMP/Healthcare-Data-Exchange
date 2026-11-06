"""Cloud Healthcare Exchange — consent service (ADR 0008).

Holds dynamic consent state and serves it to OPAL as an external data source at
`GET /policy-data`. On every change the service asks the OPAL server to publish a
data update so each OPAL client re-fetches and the OPA PDP reflects the new
consent immediately — no policy redeploy, no gateway restart.

Consent is control-plane data only (subject pseudonym + boolean flags); no PHI.
"""

from __future__ import annotations

import hmac
import logging
import os
from datetime import UTC, datetime

from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from chex_consent.opal_publish import publish_data_update
from chex_consent.store import SEED, ConsentStore

logger = logging.getLogger("chex.consent")
_bearer = HTTPBearer(auto_error=False)


def _admin_secret() -> str:
    return os.environ.get("CHEX_ADMIN_SECRET", "").strip()


def require_consent_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> None:
    secret = _admin_secret()
    if not secret:
        raise HTTPException(status_code=503, detail="admin authentication not configured")
    token = credentials.credentials if credentials else ""
    if not hmac.compare_digest(token, secret):
        raise HTTPException(status_code=401, detail="admin authentication required")


app = FastAPI(title="Cloud Healthcare Exchange Consent Service", version="0.1.0")


@app.on_event("startup")
def _require_admin_secret_on_startup() -> None:
    if not _admin_secret():
        raise RuntimeError("CHEX_ADMIN_SECRET must be set for consent admin endpoints")


# Purposes that are consent-gated in policy (chex.authz reads data.consent[subject][purpose]).
CONSENT_PURPOSES = ("research", "treatment", "derivative")

def _consent_path() -> str | None:
    configured = os.environ.get("CHEX_CONSENT_PATH")
    if configured is not None:
        return configured.strip() or None
    return os.path.join(os.environ.get("CHEX_CONSENT_DIR", "data"), "consent.json")


_store = ConsentStore(_consent_path(), SEED)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "consent"}


@app.get("/policy-data")
def policy_data() -> dict[str, dict[str, bool]]:
    """OPAL data source: complete, current consent picture keyed by subject."""
    return _store.snapshot()


@app.get("/v1/consent/{subject}")
def get_consent(subject: str) -> dict[str, object]:
    flags = _store.get(subject)
    if flags is None:
        raise HTTPException(status_code=404, detail="no consent record")
    return {"subject": subject, "consent": flags}


@app.post("/v1/consent/{subject}/{action}")
def set_consent(
    subject: str,
    action: str,
    purpose: str = "research",
    _: None = Depends(require_consent_admin),
) -> dict[str, object]:
    if action not in ("grant", "revoke"):
        raise HTTPException(status_code=400, detail="action must be grant or revoke")
    if purpose not in CONSENT_PURPOSES:
        raise HTTPException(status_code=400, detail=f"purpose must be one of {CONSENT_PURPOSES}")

    flags = _store.set_purpose(subject, purpose, action == "grant")
    published = publish_data_update(reason=f"consent.{action}:{subject}:{purpose}")
    if published is False:
        raise HTTPException(
            status_code=502,
            detail="consent saved; policy decision point was not updated",
        )

    return {
        "subject": subject,
        "purpose": purpose,
        "action": action,
        "consent": flags,
        "opal_published": published is True,
        "at": datetime.now(UTC).isoformat(),
    }
