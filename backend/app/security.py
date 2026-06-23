from datetime import UTC, datetime, timedelta

import bcrypt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .config import get_settings
from .database import get_db
from .models import User

settings = get_settings()
# auto_error=False so proxy (forward-auth) mode isn't forced to send a bearer token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)


def _encode(password: str) -> bytes:
    # bcrypt only considers the first 72 bytes; truncate to stay within its limit.
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_encode(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_encode(plain), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(subject: str) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def _user_from_proxy(request: Request, db: Session) -> User:
    """Trust identity headers injected by a forward-auth proxy (Authelia/Authentik)."""
    email = request.headers.get(settings.proxy_auth_email_header)
    if not email:
        raise CREDENTIALS_EXCEPTION

    if settings.proxy_auth_required_group:
        raw_groups = request.headers.get(settings.proxy_auth_groups_header, "")
        groups = {g.strip() for g in raw_groups.split(",") if g.strip()}
        if settings.proxy_auth_required_group not in groups:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        if not settings.proxy_auth_auto_provision:
            raise CREDENTIALS_EXCEPTION
        # No usable local password; auth is delegated to the proxy.
        user = User(email=email, hashed_password="!", is_admin=True)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def _user_from_jwt(token: str | None, db: Session) -> User:
    if not token:
        raise CREDENTIALS_EXCEPTION
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        email: str | None = payload.get("sub")
        if email is None:
            raise CREDENTIALS_EXCEPTION
    except JWTError as exc:
        raise CREDENTIALS_EXCEPTION from exc

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise CREDENTIALS_EXCEPTION
    return user


def get_current_user(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if settings.proxy_auth:
        return _user_from_proxy(request, db)
    return _user_from_jwt(token, db)
