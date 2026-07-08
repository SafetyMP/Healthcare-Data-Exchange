"""OPAL publish helper for consent-service (ADR 0008, hardened ADR 0011)."""

from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger("chex.consent.opal")

_cached_jwt: str | None = None


def _mint_publish_jwt() -> str | None:
    """Mint a datasource JWT from the OPAL master token (secure mode)."""
    global _cached_jwt
    if _cached_jwt:
        return _cached_jwt

    master = os.getenv("OPAL_AUTH_MASTER_TOKEN")
    if not master:
        return None

    server = os.getenv("OPAL_SERVER_URL", "http://opal-server:7002")
    try:
        resp = httpx.post(
            f"{server}/token",
            headers={
                "Authorization": f"Bearer {master}",
                "Content-Type": "application/json",
            },
            json={"type": "datasource"},
            timeout=5.0,
        )
        resp.raise_for_status()
        token = resp.json().get("token")
        if not isinstance(token, str) or not token:
            return None
        _cached_jwt = token
        return token
    except httpx.HTTPError as exc:  # pragma: no cover - network path
        logger.warning("OPAL JWT mint failed: %s", exc)
        return None


def auth_headers() -> dict[str, str]:
    """Bearer token for OPAL admin publish routes when secure mode is enabled."""
    if os.getenv("CHEX_OPAL_SECURE", "0") != "1":
        return {}

    explicit = os.getenv("OPAL_PUBLISH_TOKEN")
    if explicit:
        return {"Authorization": f"Bearer {explicit}"}

    token = _mint_publish_jwt()
    if not token:
        return {}
    return {"Authorization": f"Bearer {token}"}


def publish_data_update(reason: str) -> bool:
    """Ask OPAL server to publish a data update so clients re-fetch consent."""
    if os.getenv("CHEX_OPAL_PUBLISH", "1") != "1":
        return False

    server = os.getenv("OPAL_SERVER_URL", "http://opal-server:7002")
    data_url = os.getenv("CHEX_CONSENT_DATA_URL", "http://consent-service:8084/policy-data")
    dst_path = os.getenv("CHEX_CONSENT_DST_PATH", "/consent")
    topics = os.getenv("CHEX_CONSENT_TOPICS", "policy_data").split(",")
    update = {
        "entries": [{"url": data_url, "topics": topics, "dst_path": dst_path}],
        "reason": reason,
    }
    try:
        resp = httpx.post(
            f"{server}/data/config",
            json=update,
            headers=auth_headers(),
            timeout=5.0,
        )
        resp.raise_for_status()
        return True
    except httpx.HTTPError as exc:  # pragma: no cover - network path
        logger.warning("OPAL publish failed (clients will poll): %s", exc)
        return False
