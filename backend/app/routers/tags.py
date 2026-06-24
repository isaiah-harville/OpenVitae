from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Tag, User
from ..schemas import TagCreate, TagOut, TagUpdate
from ..security import get_current_user
from ..utils import slugify

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("", response_model=list[TagOut])
def list_tags(db: Session = Depends(get_db)):
    return db.query(Tag).order_by(Tag.name).all()


@router.post("", response_model=TagOut, status_code=201)
def create_tag(
    payload: TagCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    slug = slugify(payload.name, "tag")
    existing = db.query(Tag).filter(Tag.slug == slug).first()
    if existing:
        if payload.color is not None:
            existing.color = payload.color
            db.commit()
            db.refresh(existing)
        return existing
    tag = Tag(name=payload.name.strip(), slug=slug, color=payload.color)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.put("/{tag_id}", response_model=TagOut)
def update_tag(
    tag_id: int,
    payload: TagUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tag = db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if payload.name is not None:
        tag.name = payload.name.strip()
        tag.slug = slugify(payload.name, "tag")
    if payload.color is not None:
        tag.color = payload.color or None
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=204)
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tag = db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    db.delete(tag)
    db.commit()
