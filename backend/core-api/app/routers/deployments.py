from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Deployment, User, DeploymentStatus
from app.schemas import DeploymentCreate, DeploymentOut, DeploymentStatusUpdate
from app.auth import get_current_user
from app.routers.environments import _get_owned_environment

router = APIRouter(tags=["deployments"])


@router.post(
    "/environments/{environment_id}/deployments",
    response_model=DeploymentOut,
    status_code=status.HTTP_201_CREATED,
)
def create_deployment(
    environment_id: str,
    payload: DeploymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_environment(db, environment_id, current_user)
    deployment = Deployment(
        environment_id=environment_id,
        version=payload.version,
        status=DeploymentStatus.PENDING,
        triggered_by_id=current_user.id,
    )
    db.add(deployment)
    db.commit()
    db.refresh(deployment)
    return deployment


@router.get("/environments/{environment_id}/deployments", response_model=List[DeploymentOut])
def list_deployments(
    environment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_environment(db, environment_id, current_user)
    return (
        db.query(Deployment)
        .filter(Deployment.environment_id == environment_id)
        .order_by(Deployment.created_at.desc())
        .all()
    )


@router.patch("/deployments/{deployment_id}", response_model=DeploymentOut)
def update_deployment_status(
    deployment_id: str,
    payload: DeploymentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deployment = db.query(Deployment).filter(Deployment.id == deployment_id).first()
    if not deployment:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Deployment not found")
    _get_owned_environment(db, deployment.environment_id, current_user)
    deployment.status = payload.status
    db.commit()
    db.refresh(deployment)
    return deployment
