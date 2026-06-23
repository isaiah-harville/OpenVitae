from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Skill, User
from ..schemas import ReorderRequest, SkillCreate, SkillOut, SkillUpdate
from ..security import get_current_user
from ..utils import slugify, unique_slug

router = APIRouter(prefix="/api/skills", tags=["skills"])


@router.get("", response_model=list[SkillOut])
def list_skills(db: Session = Depends(get_db)):
    """Public: skills in the admin's manual order, grouped client-side by category."""
    return db.query(Skill).order_by(Skill.sort_order, Skill.name).all()


@router.post("", response_model=SkillOut, status_code=201)
def create_skill(
    payload: SkillCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    slug = slugify(payload.name, "skill")
    existing = db.query(Skill).filter(Skill.slug == slug).first()
    if existing:
        return existing
    skill = Skill(
        name=payload.name.strip(),
        slug=slug,
        category=payload.category,
        color=payload.color,
        sort_order=payload.sort_order,
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.put("/reorder", response_model=list[SkillOut])
def reorder_skills(
    payload: ReorderRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    for index, skill_id in enumerate(payload.ids):
        skill = db.get(Skill, skill_id)
        if skill:
            skill.sort_order = index
    db.commit()
    return db.query(Skill).order_by(Skill.sort_order).all()


@router.put("/{skill_id}", response_model=SkillOut)
def update_skill(
    skill_id: int,
    payload: SkillUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    skill = db.get(Skill, skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(skill, field, value)
    if payload.name is not None:
        skill.slug = unique_slug(db, Skill, slugify(payload.name, "skill"), skill.id)
    db.commit()
    db.refresh(skill)
    return skill


@router.delete("/{skill_id}", status_code=204)
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    skill = db.get(Skill, skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(skill)
    db.commit()
