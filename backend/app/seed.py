"""Idempotent seeding run on startup: create the admin user and default config."""

from sqlalchemy.orm import Session

from .config import get_settings
from .models import SiteConfig, User
from .security import hash_password

settings = get_settings()

DEFAULT_THEME = {
    # Named palette (colors live in the frontend CSS); plus the default color mode.
    "palette": "neutral",
    "defaultMode": "system",
}

DEFAULT_FEATURES = {
    "publications": True,
    "about": True,
    "contact": True,
    "headshot": True,
}

DEFAULT_PROFILE = {
    "name": "Your Name",
    "title": "Researcher",
    "bio": "Edit this bio from the /admin dashboard.",
    "location": "",
    "email": "",
    "links": [],
}


def seed(db: Session) -> None:
    if db.query(User).count() == 0:
        db.add(
            User(
                email=settings.admin_email,
                hashed_password=hash_password(settings.admin_password),
                is_admin=True,
            )
        )

    if db.get(SiteConfig, 1) is None:
        db.add(
            SiteConfig(
                id=1,
                profile=DEFAULT_PROFILE,
                theme=DEFAULT_THEME,
                features=DEFAULT_FEATURES,
            )
        )

    db.commit()
