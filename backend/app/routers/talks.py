from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Talk, User
from ..schemas import ReorderRequest, TalkCreate, TalkOut, TalkUpdate
from ..security import get_current_user
from ..storage import delete_object, presigned_url

router = APIRouter(prefix="/api/talks", tags=["talks"])


def _to_out(talk: Talk) -> TalkOut:
    out = TalkOut.model_validate(talk)
    out.file_url = presigned_url(talk.file_key)
    return out


@router.get("", response_model=list[TalkOut])
def list_talks(db: Session = Depends(get_db)):
    """Public: list talks, newest first within the admin's manual order."""
    talks = (
        db.query(Talk)
        .order_by(Talk.sort_order, Talk.event_date.desc().nullslast(), Talk.id.desc())
        .all()
    )
    return [_to_out(t) for t in talks]


@router.post("", response_model=TalkOut, status_code=201)
def create_talk(
    payload: TalkCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    talk = Talk(**payload.model_dump())
    db.add(talk)
    db.commit()
    db.refresh(talk)
    return _to_out(talk)


@router.put("/reorder", response_model=list[TalkOut])
def reorder_talks(
    payload: ReorderRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    for index, talk_id in enumerate(payload.ids):
        talk = db.get(Talk, talk_id)
        if talk:
            talk.sort_order = index
    db.commit()
    return [_to_out(t) for t in db.query(Talk).order_by(Talk.sort_order).all()]


@router.put("/{talk_id}", response_model=TalkOut)
def update_talk(
    talk_id: int,
    payload: TalkUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    talk = db.get(Talk, talk_id)
    if not talk:
        raise HTTPException(status_code=404, detail="Talk not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(talk, field, value)
    db.commit()
    db.refresh(talk)
    return _to_out(talk)


@router.delete("/{talk_id}", status_code=204)
def delete_talk(
    talk_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    talk = db.get(Talk, talk_id)
    if not talk:
        raise HTTPException(status_code=404, detail="Talk not found")
    if talk.file_key:
        delete_object(talk.file_key)
    db.delete(talk)
    db.commit()
