from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Project, Skill, Tag, User
from ..schemas import ProjectCreate, ProjectOut, ProjectUpdate, ReorderRequest
from ..security import get_current_user
from ..storage import delete_object, presigned_url
from ..utils import slugify, unique_slug

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _to_out(project: Project) -> ProjectOut:
    out = ProjectOut.model_validate(project)
    out.screenshot_urls = [
        url for key in (project.screenshot_keys or []) if (url := presigned_url(key))
    ]
    return out


def _resolve_tags(db: Session, tag_ids: list[int]) -> list[Tag]:
    if not tag_ids:
        return []
    return db.query(Tag).filter(Tag.id.in_(tag_ids)).all()


def _resolve_skills(db: Session, skill_ids: list[int]) -> list[Skill]:
    if not skill_ids:
        return []
    return db.query(Skill).filter(Skill.id.in_(skill_ids)).all()


@router.get("", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    """Public: list personal projects in the admin's manual order."""
    projects = db.query(Project).order_by(Project.sort_order, Project.id.desc()).all()
    return [_to_out(p) for p in projects]


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    data = payload.model_dump(exclude={"tag_ids", "skill_ids"})
    project = Project(**data)
    project.slug = unique_slug(db, Project, slugify(payload.name, "project"))
    project.tags = _resolve_tags(db, payload.tag_ids)
    project.skills = _resolve_skills(db, payload.skill_ids)
    db.add(project)
    db.commit()
    db.refresh(project)
    return _to_out(project)


@router.put("/reorder", response_model=list[ProjectOut])
def reorder_projects(
    payload: ReorderRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    for index, project_id in enumerate(payload.ids):
        project = db.get(Project, project_id)
        if project:
            project.sort_order = index
    db.commit()
    projects = db.query(Project).order_by(Project.sort_order).all()
    return [_to_out(p) for p in projects]


@router.get("/{slug}", response_model=ProjectOut)
def get_project(slug: str, db: Session = Depends(get_db)):
    """Public: fetch a single project by slug for its detail page."""
    project = db.query(Project).filter(Project.slug == slug).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return _to_out(project)


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    data = payload.model_dump(exclude_unset=True, exclude={"tag_ids", "skill_ids"})
    for field, value in data.items():
        setattr(project, field, value)
    if payload.name is not None:
        project.slug = unique_slug(db, Project, slugify(payload.name, "project"), project.id)
    if payload.tag_ids is not None:
        project.tags = _resolve_tags(db, payload.tag_ids)
    if payload.skill_ids is not None:
        project.skills = _resolve_skills(db, payload.skill_ids)
    db.commit()
    db.refresh(project)
    return _to_out(project)


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for key in project.screenshot_keys or []:
        delete_object(key)
    db.delete(project)
    db.commit()
