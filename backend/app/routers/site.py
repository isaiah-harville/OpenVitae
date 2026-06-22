from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SiteConfig, User
from ..schemas import SiteConfigOut, SiteConfigUpdate
from ..security import get_current_user
from ..storage import presigned_url

router = APIRouter(prefix="/api/site", tags=["site"])


def _get_or_create(db: Session) -> SiteConfig:
    config = db.get(SiteConfig, 1)
    if config is None:
        config = SiteConfig(id=1, profile={}, theme={}, features={})
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


def _to_out(config: SiteConfig) -> SiteConfigOut:
    return SiteConfigOut(
        profile=config.profile,
        theme=config.theme,
        features=config.features,
        headshot_url=presigned_url(config.headshot_key),
        updated_at=config.updated_at,
    )


@router.get("/config", response_model=SiteConfigOut)
def get_config(db: Session = Depends(get_db)):
    """Public: the full config-driven site definition consumed by the frontend."""
    return _to_out(_get_or_create(db))


@router.put("/config", response_model=SiteConfigOut)
def update_config(
    payload: SiteConfigUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    config = _get_or_create(db)
    if payload.profile is not None:
        config.profile = payload.profile
    if payload.theme is not None:
        config.theme = payload.theme
    if payload.features is not None:
        config.features = payload.features
    db.commit()
    db.refresh(config)
    return _to_out(config)
