import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
)
from sqlalchemy.orm import relationship

from app.database import Base


def gen_id() -> str:
    return uuid.uuid4().hex


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Role(str, enum.Enum):
    ADMIN = "ADMIN"
    DEVOPS = "DEVOPS"
    DEVELOPER = "DEVELOPER"
    VIEWER = "VIEWER"


class DeploymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    ROLLED_BACK = "ROLLED_BACK"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_id)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(Role), nullable=False, default=Role.DEVELOPER)
    created_at = Column(DateTime, default=utcnow)

    projects = relationship("Project", back_populates="owner")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    description = Column(String, default="")
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=utcnow)

    owner = relationship("User", back_populates="projects")
    applications = relationship(
        "Application", back_populates="project", cascade="all, delete-orphan"
    )


class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, default=gen_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)
    repo_url = Column(String, default="")
    created_at = Column(DateTime, default=utcnow)

    project = relationship("Project", back_populates="applications")
    environments = relationship(
        "Environment", back_populates="application", cascade="all, delete-orphan"
    )


class Cluster(Base):
    __tablename__ = "clusters"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    provider = Column(String, default="local")  # local | aws | gcp | azure
    region = Column(String, default="local")
    created_at = Column(DateTime, default=utcnow)

    environments = relationship("Environment", back_populates="cluster")


class Environment(Base):
    __tablename__ = "environments"

    id = Column(String, primary_key=True, default=gen_id)
    application_id = Column(String, ForeignKey("applications.id"), nullable=False)
    cluster_id = Column(String, ForeignKey("clusters.id"), nullable=True)
    name = Column(String, nullable=False)  # dev | staging | prod
    created_at = Column(DateTime, default=utcnow)

    application = relationship("Application", back_populates="environments")
    cluster = relationship("Cluster", back_populates="environments")
    deployments = relationship(
        "Deployment", back_populates="environment", cascade="all, delete-orphan"
    )


class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(String, primary_key=True, default=gen_id)
    environment_id = Column(String, ForeignKey("environments.id"), nullable=False)
    version = Column(String, nullable=False)  # e.g. v1.8.2
    status = Column(
        SAEnum(DeploymentStatus), nullable=False, default=DeploymentStatus.PENDING
    )
    triggered_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=utcnow)

    environment = relationship("Environment", back_populates="deployments")
    triggered_by = relationship("User")
