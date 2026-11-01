import pytest
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app

TEST_DB_URL = "sqlite://"  # in-memory, shared via StaticPool


@pytest.fixture()
def client(monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "jwt_secret_key", "test-only-secret-at-least-thirty-two-characters")
    monkeypatch.setattr(settings, "auth_rate_limit", 10000)
    engine = create_engine(
        TEST_DB_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
