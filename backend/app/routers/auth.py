from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import User
from ..schemas import AuthMode, Token, UserOut
from ..security import create_access_token, get_current_user, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


@router.get("/mode", response_model=AuthMode)
def auth_mode():
    """Public: lets the admin UI hide the login form when a forward-auth proxy is in use."""
    return AuthMode(mode="proxy" if settings.proxy_auth else "jwt")


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 password flow. `username` is the email address.

    This is the single seam to replace if/when swapping to an external
    OIDC provider (e.g. Keycloak) — see issue: pluggable auth.
    """
    if settings.proxy_auth:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password login is disabled; authentication is handled by the proxy.",
        )
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    return Token(access_token=create_access_token(user.email))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
