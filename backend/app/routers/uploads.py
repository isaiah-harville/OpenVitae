from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Publication, SiteConfig, User
from ..security import get_current_user
from ..storage import delete_object, presigned_url, upload_fileobj

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
DOC_TYPES = {"application/pdf"}


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
