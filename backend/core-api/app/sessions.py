import hashlib
import secrets
from datetime import datetime, timedelta
import jwt
from fastapi import HTTPException
from app.config import settings
from app.operations_models import AuthSession


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def issue(db, user, session=None):
    refresh = secrets.token_urlsafe(48)
    if session is None:
        session = AuthSession(user_id=user.id, expires_at=datetime.utcnow() + timedelta(days=7))
        db.add(session)
    session.refresh_hash = digest(refresh)
    db.flush()
    access = jwt.encode({"sub": user.id, "sid": session.id, "exp": datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)}, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    db.commit()
    return {"access_token": access, "refresh_token": session.id + "." + refresh, "token_type": "bearer"}


def lookup(db, refresh):
    sid, _, secret = refresh.partition(".")
    session = db.get(AuthSession, sid)
    if not session or session.revoked or session.expires_at < datetime.utcnow() or not secrets.compare_digest(session.refresh_hash, digest(secret)):
        raise HTTPException(401, "Invalid or expired refresh token")
    return session
