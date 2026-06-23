import re

from sqlalchemy.orm import Session

from .database import Base


def slugify(value: str, fallback: str = "item") -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
    return slug or fallback


def unique_slug(db: Session, model: type[Base], base: str, exclude_id: int | None = None) -> str:
    """Return a slug for `base` unique within `model`, suffixing -2, -3, … on collision."""
    slug = base
    suffix = 2
    while True:
        query = db.query(model).filter(model.slug == slug)
        if exclude_id is not None:
            query = query.filter(model.id != exclude_id)
        if query.first() is None:
            return slug
        slug = f"{base}-{suffix}"
        suffix += 1
