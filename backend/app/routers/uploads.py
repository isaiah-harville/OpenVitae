import re
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from ..config import get_settings
from ..database import get_db
from ..models import Project, Publication, SiteConfig, Talk, User
from ..schemas import TalkOut, TalkUploadComplete, TalkUploadRequest, TalkUploadTicket
from ..security import get_current_user
from ..storage import (
    delete_object,
    new_key,
    object_size,
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


@router.post("/talks/{talk_id}/file")
def upload_talk_file(
    talk_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if file.content_type not in SLIDE_TYPES:
        raise HTTPException(status_code=400, detail="Talk file must be a PDF or slide deck")

    talk = db.get(Talk, talk_id)
    if not talk:
        raise HTTPException(status_code=404, detail="Talk not found")

    if talk.file_key:
        delete_object(talk.file_key)

    key = upload_fileobj(file.file, file.content_type, "talks", file.filename or "slides.pdf")
    talk.file_key = key
    db.commit()
    return {"file_url": presigned_url(key)}


VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
TalkAttachment = Literal["slides", "video"]


def _attachment_rules(kind: TalkAttachment) -> tuple[str, set[str], int, str]:
    """(storage prefix, allowed types, max bytes, Talk column) for a talk attachment."""
    settings = get_settings()
    if kind == "video":
        return "talk-videos", VIDEO_TYPES, settings.talk_video_max_mb * 1024 * 1024, "video_key"
    return "talks", SLIDE_TYPES, settings.talk_slides_max_mb * 1024 * 1024, "file_key"


def _talk_out(talk: Talk) -> TalkOut:
    out = TalkOut.model_validate(talk)
    out.file_url = presigned_url(talk.file_key)
    out.video_url = presigned_url(talk.video_key)
    return out


def _get_talk(db: Session, talk_id: int) -> Talk:
    talk = db.get(Talk, talk_id)
    if not talk:
        raise HTTPException(status_code=404, detail="Talk not found")
    return talk


@router.post("/talks/{talk_id}/{kind}/upload-url", response_model=TalkUploadTicket)
def talk_upload_url(
    talk_id: int,
    kind: TalkAttachment,
    payload: TalkUploadRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Step 1 of a direct upload: a one-time URL the browser PUTs the file to.

    Slides and recordings can be far larger than a reverse proxy allows, so the file
    goes straight to object storage. Finish with POST /talks/{talk_id}/{kind}.
    """
    _get_talk(db, talk_id)
    prefix, types, max_bytes, _column = _attachment_rules(kind)
    if payload.content_type not in types:
        allowed = "MP4, WebM, or MOV" if kind == "video" else "a PDF or slide deck"
        raise HTTPException(status_code=400, detail=f"Talk {kind} must be {allowed}")
    if payload.size > max_bytes:
        limit = max_bytes // (1024 * 1024)
        raise HTTPException(status_code=400, detail=f"Talk {kind} must be under {limit} MB")
    key = new_key(prefix, payload.filename)
    return TalkUploadTicket(
        upload_url=presigned_put(key, payload.content_type, payload.size),
        key=key,
        headers={"Content-Type": payload.content_type},
    )


@router.post("/talks/{talk_id}/{kind}", response_model=TalkOut)
def complete_talk_upload(
    talk_id: int,
    kind: TalkAttachment,
    payload: TalkUploadComplete,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Step 2 of a direct upload: attach the uploaded object to the talk."""
    talk = _get_talk(db, talk_id)
    prefix, _types, max_bytes, column = _attachment_rules(kind)
    # Only keys minted by talk_upload_url for this kind may be attached.
    if not re.fullmatch(rf"{prefix}/[0-9a-f]{{32}}\.[a-z0-9]{{1,10}}", payload.key):
        raise HTTPException(status_code=400, detail="Not an upload key for this attachment")
    size = object_size(payload.key)
    if size is None:
        raise HTTPException(status_code=400, detail="Upload not found; PUT the file first")
    if size > max_bytes:
        delete_object(payload.key)
        raise HTTPException(status_code=400, detail=f"Talk {kind} is too large")
    previous = getattr(talk, column)
    setattr(talk, column, payload.key)
    db.commit()
    if previous and previous != payload.key:
        delete_object(previous)
    db.refresh(talk)
    return _talk_out(talk)


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
        db.commit()
        delete_object(key)
        db.refresh(talk)
    return _talk_out(talk)


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
