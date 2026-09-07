from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Application, User
from app.schemas import ApplicationCreate, ApplicationOut
from app.auth import get_current_user
from app.routers.projects import _get_owned_project

router = APIRouter(tags=["applications"])


@router.post(
    "/projects/{project_id}/applications",
    response_model=ApplicationOut,
    status_code=status.HTTP_201_CREATED,
)
def create_application(
    project_id: str,
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_project(db, project_id, current_user)  # 404/403 if not yours
    app_ = Application(project_id=project_id, name=payload.name, repo_url=payload.repo_url)
    db.add(app_)
    db.commit()
    db.refresh(app_)
    return app_


@router.get("/projects/{project_id}/applications", response_model=List[ApplicationOut])
def list_applications(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_project(db, project_id, current_user)
    return db.query(Application).filter(Application.project_id == project_id).all()


@router.get("/applications/{application_id}", response_model=ApplicationOut)
def get_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app_ = _get_owned_application(db, application_id, current_user)
    return app_


def _get_owned_application(db: Session, application_id: str, current_user: User) -> Application:
    app_ = db.query(Application).filter(Application.id == application_id).first()
    if not app_:
        raise HTTPException(status_code=404, detail="Application not found")
    _get_owned_project(db, app_.project_id, current_user)  # enforces ownership
    return app_
