"""Persistent telemetry, decisions, investigations and authentication sessions."""
from sqlalchemy import Column, String, DateTime, Float, Integer, JSON, ForeignKey, UniqueConstraint
from app.database import Base
from app.models import gen_id, utcnow


class AuthSession(Base):
    __tablename__ = "auth_sessions"
    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    refresh_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Integer, default=0, nullable=False)


class Metric(Base):
    __tablename__ = "metric_samples"
    __table_args__ = (UniqueConstraint("environment_id", "timestamp", "source"),)
    id = Column(String, primary_key=True, default=gen_id)
    environment_id = Column(String, ForeignKey("environments.id", ondelete="CASCADE"), index=True, nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    source = Column(String, nullable=False)
    cpu = Column(Float, nullable=False)
    memory = Column(Float, nullable=False)
    rps = Column(Float, nullable=False)
    latency_ms = Column(Float, nullable=False)
    error_rate = Column(Float, nullable=False)
    replicas = Column(Integer, nullable=False)
    cost_per_hour = Column(Float, nullable=False)


class Event(Base):
    __tablename__ = "operation_events"
    id = Column(String, primary_key=True, default=gen_id)
    environment_id = Column(String, ForeignKey("environments.id", ondelete="CASCADE"), index=True)
    actor_id = Column(String, index=True)
    kind = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, index=True)
    data = Column(JSON, nullable=False, default=dict)
    published = Column(Integer, default=0, nullable=False)


class Policy(Base):
    __tablename__ = "scaling_policies"
    environment_id = Column(String, ForeignKey("environments.id", ondelete="CASCADE"), primary_key=True)
    data = Column(JSON, nullable=False, default=dict)


class DemoState(Base):
    __tablename__ = "demo_states"
    environment_id = Column(String, ForeignKey("environments.id", ondelete="CASCADE"), primary_key=True)
    replicas = Column(Integer, default=3)
    incident_until = Column(DateTime)
    last_sample = Column(DateTime)


class ModelArtifact(Base):
    __tablename__ = "model_artifacts"
    id = Column(String, primary_key=True, default=gen_id)
    environment_id = Column(String, ForeignKey("environments.id", ondelete="CASCADE"), index=True, nullable=False)
    algorithm = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow)
    metrics = Column(JSON, nullable=False)


class OIDCIdentity(Base):
    __tablename__ = 'oidc_identities'
    __table_args__ = (UniqueConstraint('issuer','subject'),)
    id = Column(String,primary_key=True,default=gen_id)
    user_id = Column(String,ForeignKey('users.id',ondelete='CASCADE'),nullable=False)
    issuer = Column(String,nullable=False)
    subject = Column(String,nullable=False)


class LoginExchange(Base):
    __tablename__ = 'login_exchanges'
    code_hash = Column(String,primary_key=True)
    user_id = Column(String,ForeignKey('users.id',ondelete='CASCADE'),nullable=False)
    expires_at = Column(DateTime,nullable=False)
