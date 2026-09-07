from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Project, User
from app.schemas import ProjectCreate, ProjectOut
from app.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(
        name=payload.name, description=payload.description, owner_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=List[ProjectOut])
def list_projects(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return db.query(Project).filter(Project.owner_id == current_user.id).all()


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_owned_project(db, project_id, current_user)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_owned_project(db, project_id, current_user)
    db.delete(project)
    db.commit()


def _get_owned_project(db: Session, project_id: str, current_user: User) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your project")
    return project
