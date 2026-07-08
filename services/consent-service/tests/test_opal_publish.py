import os
from unittest.mock import MagicMock

import chex_consent.opal_publish as opal_publish

os.environ["CHEX_OPAL_PUBLISH"] = "0"


def test_auth_headers_off_when_not_secure() -> None:
    os.environ.pop("CHEX_OPAL_SECURE", None)
    os.environ.pop("OPAL_AUTH_MASTER_TOKEN", None)
    opal_publish._cached_jwt = None
    assert opal_publish.auth_headers() == {}


def test_auth_headers_explicit_publish_token() -> None:
    os.environ["CHEX_OPAL_SECURE"] = "1"
    os.environ["OPAL_PUBLISH_TOKEN"] = "explicit-jwt"
    opal_publish._cached_jwt = None
    assert opal_publish.auth_headers() == {"Authorization": "Bearer explicit-jwt"}


def test_auth_headers_mints_jwt_from_master(monkeypatch) -> None:
    os.environ["CHEX_OPAL_SECURE"] = "1"
    os.environ.pop("OPAL_PUBLISH_TOKEN", None)
    os.environ["OPAL_AUTH_MASTER_TOKEN"] = "demo-master"
    opal_publish._cached_jwt = None

    mock_resp = MagicMock()
    mock_resp.raise_for_status.return_value = None
    mock_resp.json.return_value = {"token": "minted-jwt"}
    mock_post = MagicMock(return_value=mock_resp)
    monkeypatch.setattr(opal_publish.httpx, "post", mock_post)

    headers = opal_publish.auth_headers()
    assert headers == {"Authorization": "Bearer minted-jwt"}
    assert mock_post.call_args.kwargs["json"] == {"type": "datasource"}


def test_publish_skipped_when_disabled() -> None:
    os.environ["CHEX_OPAL_PUBLISH"] = "0"
    assert opal_publish.publish_data_update("test") is False
