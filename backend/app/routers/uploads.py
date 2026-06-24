from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from ..database import get_db
from ..models import Project, Publication, SiteConfig, Talk, User
from ..security import get_current_user
from ..storage import delete_object, presigned_url, upload_fileobj

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
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
