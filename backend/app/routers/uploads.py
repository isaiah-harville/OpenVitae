import re
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from ..config import get_settings
from ..database import get_db
from ..models import Attachment, BlogPost, Project, Publication, SiteConfig, Talk, User
from ..previews import replace_preview
from ..schemas import (
    AttachmentComplete,
    AttachmentOut,
    TalkOut,
    UploadComplete,
    UploadRequest,
    UploadTicket,
)
from ..security import get_current_user
from ..serialize import attachment_out, talk_out
from ..storage import (
    delete_object,
    new_key,
    object_head,
    presigned_put,
    presigned_url,
    upload_fileobj,
)

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.post("/page-image")
async def upload_page_image(
    file: UploadFile = File(...),
    _: User = Depends(get_current_user),
):
    if file.content_type not in IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Page image must be jpeg, png, webp, or gif")
    content = await file.read(8 * 1024 * 1024 + 1)
    if len(content) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Page image must be under 8 MB")
    from io import BytesIO

    key = upload_fileobj(
        BytesIO(content), file.content_type, "page-images", file.filename or "image.png"
    )
    return {"image_key": key}


@router.get("/page-image/{key:path}")
def get_page_image(key: str, db: Session = Depends(get_db)):
    full_key = f"page-images/{key}"
    config = db.get(SiteConfig, 1)
    if (
        not config
        or not config.pages
        or not any(
            block.get("imageKey") == full_key
            for page in config.pages.get("pages", [])
            for block in page.get("blocks", [])
        )
    ):
        raise HTTPException(status_code=404, detail="Page image not found")
    return RedirectResponse(presigned_url(full_key), status_code=302)


DOC_TYPES = {"application/pdf"}
# Slides and similar talk attachments: PDF + common presentation formats.
SLIDE_TYPES = DOC_TYPES | {
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.oasis.opendocument.presentation",
}


@router.post("/headshot")
def upload_headshot(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if file.content_type not in IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Headshot must be an image (jpeg/png/webp/gif)")

    config = db.get(SiteConfig, 1)
    if config is None:
        config = SiteConfig(id=1, profile={}, theme={}, features={})
        db.add(config)

    if config.headshot_key:
        delete_object(config.headshot_key)

    key = upload_fileobj(file.file, file.content_type, "headshots", file.filename or "headshot.jpg")
    config.headshot_key = key
    db.commit()
    return {"headshot_url": presigned_url(key)}


@router.post("/publications/{pub_id}/file")
def upload_publication_file(
    pub_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if file.content_type not in DOC_TYPES:
        raise HTTPException(status_code=400, detail="Publication file must be a PDF")

    pub = db.get(Publication, pub_id)
    if not pub:
        raise HTTPException(status_code=404, detail="Publication not found")

    if pub.file_key:
        delete_object(pub.file_key)

    key = upload_fileobj(file.file, file.content_type, "papers", file.filename or "paper.pdf")
    pub.file_key = key
    db.commit()
    return {"file_url": presigned_url(key)}


VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
ATTACHMENT_TYPES = (
    SLIDE_TYPES
    | IMAGE_TYPES
    | VIDEO_TYPES
    | {
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.oasis.opendocument.text",
        "application/vnd.oasis.opendocument.spreadsheet",
        "application/epub+zip",
        "application/zip",
        "application/x-zip-compressed",
        "application/gzip",
        "text/plain",
        "text/markdown",
        "text/csv",
        "audio/mpeg",
        "audio/mp4",
        "audio/wav",
    }
)
TalkAttachment = Literal["slides", "video"]
AttachmentOwner = Literal["talks", "blog-posts"]


def _mb(value: int) -> int:
    return value * 1024 * 1024


def _ticket(
    prefix: str, payload: UploadRequest, types: set[str], max_bytes: int, what: str, allowed: str
):
    """Step 1 of a direct upload: a one-time URL the browser PUTs the file to.

    Files can be far larger than a reverse proxy allows, so they go straight to
    object storage; the matching completion endpoint then attaches the stored key.
    """
    if payload.content_type not in types:
        raise HTTPException(
            status_code=400, detail=f"{what} must be {allowed}, not {payload.content_type}"
        )
    if payload.size > max_bytes:
        limit = max_bytes // (1024 * 1024)
        raise HTTPException(status_code=400, detail=f"{what} must be under {limit} MB")
    key = new_key(prefix, payload.filename)
    return UploadTicket(
        upload_url=presigned_put(key, payload.content_type, payload.size),
        key=key,
        headers={"Content-Type": payload.content_type},
    )


def _claim(prefix: str, key: str, max_bytes: int, what: str) -> tuple[int, str]:
    """Check that key was minted for prefix and has been uploaded; return (size, type)."""
    if not re.fullmatch(rf"{prefix}/[0-9a-f]{{32}}\.[a-z0-9]{{1,10}}", key):
        raise HTTPException(status_code=400, detail="Not an upload key for this file")
    head = object_head(key)
    if head is None:
        raise HTTPException(status_code=400, detail="Upload not found; PUT the file first")
    if head[0] > max_bytes:
        delete_object(key)
        raise HTTPException(status_code=400, detail=f"{what} is too large")
    return head


def _attachment_rules(kind: TalkAttachment) -> tuple[str, set[str], int, str]:
    """(storage prefix, allowed types, max bytes, Talk column) for a talk attachment."""
    settings = get_settings()
    if kind == "video":
        return "talk-videos", VIDEO_TYPES, _mb(settings.talk_video_max_mb), "video_key"
    return "talks", SLIDE_TYPES, _mb(settings.talk_slides_max_mb), "file_key"


def _get_talk(db: Session, talk_id: int) -> Talk:
    talk = db.get(Talk, talk_id)
    if not talk:
        raise HTTPException(status_code=404, detail="Talk not found")
    return talk


@router.post("/talks/{talk_id}/{kind}/upload-url", response_model=UploadTicket)
def talk_upload_url(
    talk_id: int,
    kind: TalkAttachment,
    payload: UploadRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Start uploading a talk's slides or video; finish with POST /talks/{talk_id}/{kind}."""
    _get_talk(db, talk_id)
    prefix, types, max_bytes, _column = _attachment_rules(kind)
    allowed = "MP4, WebM, or MOV" if kind == "video" else "a PDF or slide deck"
    return _ticket(prefix, payload, types, max_bytes, f"Talk {kind}", allowed)


@router.post("/talks/{talk_id}/{kind}", response_model=TalkOut)
def complete_talk_upload(
    talk_id: int,
    kind: TalkAttachment,
    payload: UploadComplete,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Attach an uploaded slide deck or video to the talk, replacing any previous one."""
    talk = _get_talk(db, talk_id)
    prefix, _types, max_bytes, column = _attachment_rules(kind)
    _size, content_type = _claim(prefix, payload.key, max_bytes, f"Talk {kind}")
    previous = getattr(talk, column)
    setattr(talk, column, payload.key)
    if kind == "slides":
        talk.file_preview_key = replace_preview(talk.file_preview_key, payload.key, content_type)
    db.commit()
    if previous and previous != payload.key:
        delete_object(previous)
    db.refresh(talk)
    return talk_out(talk)


@router.delete("/talks/{talk_id}/{kind}", response_model=TalkOut)
def delete_talk_attachment(
    talk_id: int,
    kind: TalkAttachment,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    talk = _get_talk(db, talk_id)
    _prefix, _types, _max, column = _attachment_rules(kind)
    if key := getattr(talk, column):
        setattr(talk, column, None)
        if kind == "slides":
            talk.file_preview_key = replace_preview(talk.file_preview_key, None, "")
        db.commit()
        delete_object(key)
        db.refresh(talk)
    return talk_out(talk)


def _owner(db: Session, owner: AttachmentOwner, owner_id: int) -> dict[str, int]:
    """The Attachment foreign key for an existing owner, e.g. {"talk_id": 7}."""
    model, column = (Talk, "talk_id") if owner == "talks" else (BlogPost, "blog_post_id")
    if not db.get(model, owner_id):
        noun = "Talk" if owner == "talks" else "Blog post"
        raise HTTPException(status_code=404, detail=f"{noun} not found")
    return {column: owner_id}


@router.post("/attachments/{owner}/{owner_id}/upload-url", response_model=UploadTicket)
def attachment_upload_url(
    owner: AttachmentOwner,
    owner_id: int,
    payload: UploadRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Start uploading a file to a talk or blog post.

    Finish by POSTing the returned key to /attachments/{owner}/{owner_id}.
    """
    _owner(db, owner, owner_id)
    max_bytes = _mb(get_settings().attachment_max_mb)
    allowed = "a document, slide deck, image, video, audio file, or archive"
    return _ticket("attachments", payload, ATTACHMENT_TYPES, max_bytes, "An attachment", allowed)


@router.post("/attachments/{owner}/{owner_id}", response_model=AttachmentOut, status_code=201)
def complete_attachment_upload(
    owner: AttachmentOwner,
    owner_id: int,
    payload: AttachmentComplete,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    foreign_key = _owner(db, owner, owner_id)
    max_bytes = _mb(get_settings().attachment_max_mb)
    size, content_type = _claim("attachments", payload.key, max_bytes, "The attachment")
    count = db.query(Attachment).filter_by(**foreign_key).count()
    attachment = Attachment(
        **foreign_key,
        key=payload.key,
        filename=payload.filename.replace("/", "_").replace("\\", "_").strip(),
        content_type=content_type,
        size=size,
        preview_key=replace_preview(None, payload.key, content_type),
        sort_order=count,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment_out(attachment)


@router.delete("/attachments/{attachment_id}", status_code=204)
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    attachment = db.get(Attachment, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    keys = attachment.stored_keys()
    db.delete(attachment)
    db.commit()
    for key in keys:
        delete_object(key)


@router.post("/projects/{project_id}/screenshots")
def upload_project_screenshot(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if file.content_type not in IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Screenshot must be an image")

    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    key = upload_fileobj(
        file.file, file.content_type, "screenshots", file.filename or "screenshot.png"
    )
    project.screenshot_keys = [*(project.screenshot_keys or []), key]
    flag_modified(project, "screenshot_keys")
    db.commit()
    return {"screenshot_urls": [presigned_url(k) for k in project.screenshot_keys]}


@router.delete("/projects/{project_id}/screenshots")
def delete_project_screenshot(
    project_id: int,
    index: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Remove the screenshot at the given position from the project's ordered list."""
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    keys = list(project.screenshot_keys or [])
    if index < 0 or index >= len(keys):
        raise HTTPException(status_code=404, detail="Screenshot not found")

    delete_object(keys.pop(index))
    project.screenshot_keys = keys
    flag_modified(project, "screenshot_keys")
    db.commit()
    return {"screenshot_urls": [presigned_url(k) for k in keys]}
