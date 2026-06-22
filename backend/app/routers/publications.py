from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Publication, Tag, User
from ..schemas import (
    PublicationCreate,
    PublicationOut,
    PublicationUpdate,
    ReorderRequest,
)
from ..security import get_current_user
from ..storage import presigned_url

router = APIRouter(prefix="/api/publications", tags=["publications"])


def _to_out(pub: Publication) -> PublicationOut:
    out = PublicationOut.model_validate(pub)
    out.file_url = presigned_url(pub.file_key)
    return out


def _resolve_tags(db: Session, tag_ids: list[int]) -> list[Tag]:
    if not tag_ids:
        return []
    return db.query(Tag).filter(Tag.id.in_(tag_ids)).all()


@router.get("", response_model=list[PublicationOut])
def list_publications(
    db: Session = Depends(get_db),
    tag: str | None = Query(None, description="Filter by tag slug"),
    featured: bool | None = Query(None, description="Filter to featured only"),
    sort: str | None = Query(None, description="date_desc | date_asc"),
    limit: int | None = Query(None, ge=1, description="Max results"),
):
    """Public: list publications, optionally filtered by tag slug / featured, sorted."""
    query = db.query(Publication)
    if tag:
        query = query.join(Publication.tags).filter(Tag.slug == tag)
    if featured is not None:
        query = query.filter(Publication.featured.is_(featured))

    if sort == "date_asc":
        query = query.order_by(Publication.year.asc().nullslast(), Publication.id.desc())
    elif sort == "date_desc":
        query = query.order_by(Publication.year.desc().nullslast(), Publication.id.desc())
    else:
        # Default: featured first, then the admin's manual order.
        query = query.order_by(
            Publication.featured.desc(),
            Publication.sort_order,
            Publication.year.desc().nullslast(),
            Publication.id.desc(),
        )
    if limit:
        query = query.limit(limit)
    return [_to_out(p) for p in query.all()]


@router.put("/reorder", response_model=list[PublicationOut])
def reorder_publications(
    payload: ReorderRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Set sort_order from the given id ordering (index = sort_order)."""
    for index, pub_id in enumerate(payload.ids):
        pub = db.get(Publication, pub_id)
        if pub:
            pub.sort_order = index
    db.commit()
    pubs = db.query(Publication).order_by(Publication.sort_order).all()
    return [_to_out(p) for p in pubs]


@router.get("/{pub_id}", response_model=PublicationOut)
def get_publication(pub_id: int, db: Session = Depends(get_db)):
    pub = db.get(Publication, pub_id)
    if not pub:
        raise HTTPException(status_code=404, detail="Publication not found")
    return _to_out(pub)


@router.post("", response_model=PublicationOut, status_code=201)
def create_publication(
    payload: PublicationCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    data = payload.model_dump(exclude={"tag_ids"})
    pub = Publication(**data)
    pub.tags = _resolve_tags(db, payload.tag_ids)
    db.add(pub)
    db.commit()
    db.refresh(pub)
    return _to_out(pub)


@router.put("/{pub_id}", response_model=PublicationOut)
def update_publication(
    pub_id: int,
    payload: PublicationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    pub = db.get(Publication, pub_id)
    if not pub:
        raise HTTPException(status_code=404, detail="Publication not found")
    data = payload.model_dump(exclude_unset=True, exclude={"tag_ids"})
    for field, value in data.items():
        setattr(pub, field, value)
    if payload.tag_ids is not None:
        pub.tags = _resolve_tags(db, payload.tag_ids)
    db.commit()
    db.refresh(pub)
    return _to_out(pub)


@router.delete("/{pub_id}", status_code=204)
def delete_publication(
    pub_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    pub = db.get(Publication, pub_id)
    if not pub:
        raise HTTPException(status_code=404, detail="Publication not found")
    db.delete(pub)
    db.commit()
