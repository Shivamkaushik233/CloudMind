from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Cluster, Role
from app.schemas import ClusterCreate, ClusterOut
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/clusters", tags=["clusters"])


@router.post(
    "",
    response_model=ClusterOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(Role.ADMIN, Role.DEVOPS))],
)
def create_cluster(payload: ClusterCreate, db: Session = Depends(get_db)):
    cluster = Cluster(name=payload.name, provider=payload.provider, region=payload.region)
    db.add(cluster)
    db.commit()
    db.refresh(cluster)
    return cluster


@router.get("", response_model=List[ClusterOut], dependencies=[Depends(get_current_user)])
def list_clusters(db: Session = Depends(get_db)):
    return db.query(Cluster).all()


@router.delete(
    "/{cluster_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(Role.ADMIN, Role.DEVOPS))],
)
def delete_cluster(cluster_id: str, db: Session = Depends(get_db)):
    cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    db.delete(cluster)
    db.commit()
