"""Built-in blog; drafts require admin authentication and never enter public responses."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import BlogPost, SiteConfig, User
from ..schemas import BlogPostCreate, BlogPostOut, BlogPostSummary, BlogPostUpdate
from ..security import get_current_user
from ..serialize import blog_post_out
from ..storage import delete_object
from ..utils import slugify, unique_slug

router = APIRouter(prefix="/api/blog", tags=["blog"])


def _enabled(db: Session) -> bool:
    config = db.get(SiteConfig, 1)
    return bool(config and config.features.get("blog", False))


@router.get("", response_model=list[BlogPostSummary])
def list_public_posts(db: Session = Depends(get_db)):
    if not _enabled(db):
        raise HTTPException(status_code=404, detail="Blog is disabled in site settings")
    return (
        db.query(BlogPost)
        .filter(BlogPost.published.is_(True))
        .order_by(BlogPost.published_at.desc(), BlogPost.id.desc())
        .all()
    )


@router.get("/posts", response_model=list[BlogPostOut])
def list_admin_posts(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    posts = (
        db.query(BlogPost)
        .options(selectinload(BlogPost.attachments))
        .order_by(BlogPost.created_at.desc(), BlogPost.id.desc())
        .all()
    )
    return [blog_post_out(post) for post in posts]


@router.post("/posts", response_model=BlogPostOut, status_code=201)
def create_post(
    payload: BlogPostCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    data = payload.model_dump()
    post = BlogPost(
        **data,
        slug=unique_slug(db, BlogPost, slugify(payload.title, "post")),
        published_at=datetime.now(UTC) if payload.published else None,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return blog_post_out(post)


@router.put("/posts/{post_id}", response_model=BlogPostOut)
def update_post(
    post_id: int,
    payload: BlogPostUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    data = payload.model_dump(exclude_unset=True)
    for key in ("title", "excerpt", "content"):
        if key in data:
            setattr(post, key, data[key])
    if payload.published is not None and payload.published != post.published:
        post.published = payload.published
        post.published_at = datetime.now(UTC) if payload.published else None
    db.commit()
    db.refresh(post)
    return blog_post_out(post)


@router.delete("/posts/{post_id}", status_code=204)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    keys = [key for attachment in post.attachments for key in attachment.stored_keys()]
    db.delete(post)
    db.commit()
    for key in keys:
        delete_object(key)


@router.get("/{slug}", response_model=BlogPostOut)
def get_public_post(slug: str, db: Session = Depends(get_db)):
    if not _enabled(db):
        raise HTTPException(status_code=404, detail="Blog is disabled in site settings")
    post = db.query(BlogPost).filter(BlogPost.slug == slug, BlogPost.published.is_(True)).first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return blog_post_out(post)
