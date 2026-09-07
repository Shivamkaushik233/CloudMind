from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict

from app.models import Role, DeploymentStatus


# ---------- Auth ----------


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: Role = Role.DEVELOPER


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str
    role: Role
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Projects ----------


class ProjectCreate(BaseModel):
    name: str
    description: str = ""


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    owner_id: str
    created_at: datetime


# ---------- Applications ----------


class ApplicationCreate(BaseModel):
    name: str
    repo_url: str = ""


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    name: str
    repo_url: str
    created_at: datetime


# ---------- Clusters ----------


class ClusterCreate(BaseModel):
    name: str
    provider: str = "local"
    region: str = "local"


class ClusterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    provider: str
    region: str
    created_at: datetime


# ---------- Environments ----------


class EnvironmentCreate(BaseModel):
    name: str
    cluster_id: Optional[str] = None


class EnvironmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    cluster_id: Optional[str]
    name: str
    created_at: datetime


# ---------- Deployments ----------


class DeploymentCreate(BaseModel):
    version: str


class DeploymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    environment_id: str
    version: str
    status: DeploymentStatus
    triggered_by_id: str
    created_at: datetime


class DeploymentStatusUpdate(BaseModel):
    status: DeploymentStatus
