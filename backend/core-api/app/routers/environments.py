from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Environment, User, Cluster
from app.schemas import EnvironmentCreate, EnvironmentOut
from app.auth import get_current_user
from app.routers.applications import _get_owned_application

router = APIRouter(tags=["environments"])


@router.post(
    "/applications/{application_id}/environments",
    response_model=EnvironmentOut,
    status_code=status.HTTP_201_CREATED,
)
def create_environment(
    application_id: str,
    payload: EnvironmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_application(db, application_id, current_user)

    if payload.cluster_id:
        cluster = db.query(Cluster).filter(Cluster.id == payload.cluster_id).first()
        if not cluster:
            raise HTTPException(status_code=404, detail="Cluster not found")

    env = Environment(
        application_id=application_id, name=payload.name, cluster_id=payload.cluster_id
    )
    db.add(env)
    db.commit()
    db.refresh(env)
    return env


@router.get("/applications/{application_id}/environments", response_model=List[EnvironmentOut])
def list_environments(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_application(db, application_id, current_user)
    return db.query(Environment).filter(Environment.application_id == application_id).all()


def _get_owned_environment(db: Session, environment_id: str, current_user: User) -> Environment:
    env = db.query(Environment).filter(Environment.id == environment_id).first()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    _get_owned_application(db, env.application_id, current_user)
    return env
