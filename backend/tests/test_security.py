"""Bearer token issue and validation without a database."""

from datetime import UTC, datetime, timedelta

import jwt
import pytest
from fastapi import HTTPException

from app.config import get_settings
from app.security import _user_from_jwt, create_access_token

settings = get_settings()


class _Query:
    def __init__(self, user):
        self.user = user

    def filter(self, *_):
        return self

    def first(self):
        return self.user


class _Db:
    def __init__(self, user):
        self.user = user

    def query(self, _model):
        return _Query(self.user)


def test_issued_token_resolves_to_its_user():
    user = object()
    token = create_access_token("admin@example.com")
    assert _user_from_jwt(token, _Db(user)) is user


@pytest.mark.parametrize(
    "token",
    [
        None,
        "not-a-jwt",
        jwt.encode({"sub": "admin@example.com"}, "wrong-secret", algorithm="HS256"),
        jwt.encode(
            {"sub": "admin@example.com", "exp": datetime.now(UTC) - timedelta(minutes=1)},
            settings.jwt_secret,
            algorithm=settings.jwt_algorithm,
        ),
        jwt.encode({"exp": datetime.now(UTC) + timedelta(minutes=5)}, settings.jwt_secret),
    ],
    ids=["missing", "malformed", "wrong-secret", "expired", "no-subject"],
)
def test_invalid_tokens_are_rejected_with_401(token):
    with pytest.raises(HTTPException) as exc:
        _user_from_jwt(token, _Db(object()))
    assert exc.value.status_code == 401
