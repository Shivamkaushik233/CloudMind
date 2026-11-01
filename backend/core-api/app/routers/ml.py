import shutil
import threading
from pathlib import Path
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, get_writer
from app.models import User, gen_id
from app.operations_models import ModelArtifact
from app.config import settings
from app.routers.environments import _get_owned_environment
from app.routers.operations import require_data
from app.telemetry import event
from app import advanced_ml

router=APIRouter(prefix="/operations",tags=["models"])
training_lock=threading.Lock()


class TrainingRequest(BaseModel):
    algorithm: Literal["xgboost","lstm","transformer","qlearning"]
    epochs: int=Field(default=30,ge=1,le=100)


@router.get("/{env_id}/models")
def models(env_id:str,db:Session=Depends(get_db),user:User=Depends(get_current_user)):
    _get_owned_environment(db,env_id,user)
    return [{"id":m.id,"algorithm":m.algorithm,"created_at":m.created_at,"metrics":m.metrics} for m in db.query(ModelArtifact).filter_by(environment_id=env_id).order_by(ModelArtifact.created_at.desc()).limit(30)]


@router.post("/{env_id}/models/train",status_code=201)
def train(env_id:str,body:TrainingRequest,db:Session=Depends(get_db),user:User=Depends(get_writer)):
    _get_owned_environment(db,env_id,user)
    rows=require_data(db,env_id)
    if not training_lock.acquire(blocking=False):
        raise HTTPException(429,"Another model is training; retry shortly")
    artifact_id=gen_id(); path=Path(settings.model_store)/artifact_id
    try:
        report=advanced_ml.train(rows,body.algorithm,path,body.epochs)
        db.add(ModelArtifact(id=artifact_id,environment_id=env_id,algorithm=body.algorithm,metrics=report))
        event(db,env_id,user.id,"model.trained",{"artifact_id":artifact_id,**report})
        db.commit()
        return {"id":artifact_id,**report}
    except ImportError:
        if path.exists(): shutil.rmtree(path)
        raise HTTPException(503,"Install requirements-ml.txt to enable this model")
    except ValueError as exc:
        if path.exists(): shutil.rmtree(path)
        raise HTTPException(409,str(exc))
    except Exception:
        db.rollback()
        if path.exists(): shutil.rmtree(path)
        raise
    finally:
        training_lock.release()
