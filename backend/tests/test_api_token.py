"""The static API_TOKEN resolves to the first admin and nothing else."""

from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app import security


def _db_returning(user):
    db = MagicMock()
    db.query.return_value.filter.return_value.order_by.return_value.first.return_value = user
    return db


@pytest.fixture
def token(monkeypatch):
    monkeypatch.setattr(security.settings, "api_token", "s3cret-token")
    return "s3cret-token"


def test_matching_token_returns_first_admin(token):
    admin = object()
    assert security._user_from_api_token(token, _db_returning(admin)) is admin


def test_wrong_or_missing_token_falls_through(token):
    db = _db_returning(object())
    assert security._user_from_api_token("wrong", db) is None
    assert security._user_from_api_token(None, db) is None
    db.query.assert_not_called()


def test_disabled_when_unset(monkeypatch):
    monkeypatch.setattr(security.settings, "api_token", "")
    assert security._user_from_api_token("", _db_returning(object())) is None


def test_token_without_admin_is_rejected(token):
    with pytest.raises(HTTPException) as exc:
        security._user_from_api_token(token, _db_returning(None))
    assert exc.value.status_code == 401
