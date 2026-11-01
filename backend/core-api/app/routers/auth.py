from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Role, Deployment
from app.schemas import UserCreate, UserOut, Token
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_roles,
)
from pydantic import BaseModel, Field
from app.sessions import issue, lookup
from app.operations_models import AuthSession

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if payload.role != Role.DEVELOPER:
        raise HTTPException(403, "Public registration creates developer accounts only")
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm's "username" field carries the email.
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return issue(db, user)


class RefreshInput(BaseModel):
    refresh_token: str = Field(max_length=256)


@router.post("/refresh", response_model=Token)
def refresh(payload: RefreshInput, db: Session = Depends(get_db)):
    session = lookup(db, payload.refresh_token)
    previous_hash = session.refresh_hash
    from app.sessions import digest
    import secrets
    changed = db.query(AuthSession).filter(AuthSession.id == session.id, AuthSession.refresh_hash == previous_hash, AuthSession.revoked == 0).update({"refresh_hash": digest(secrets.token_urlsafe(48))})
    if changed != 1:
        db.rollback()
        raise HTTPException(401, "Refresh token already used")
    user = db.get(User, session.user_id)
    if not user:
        raise HTTPException(401, "Account no longer exists")
    return issue(db, user, session)


@router.post("/logout", status_code=204)
def logout(payload: RefreshInput, db: Session = Depends(get_db)):
    session = lookup(db, payload.refresh_token)
    session.revoked = 1
    db.commit()


class RoleInput(BaseModel):
    role: Role


@router.patch("/users/{user_id}/role", response_model=UserOut)
def change_role(user_id: str, payload: RoleInput, db: Session = Depends(get_db), admin: User = Depends(require_roles(Role.ADMIN))):
    if user_id == admin.id:
        raise HTTPException(400, "Cannot change your own administrator role")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.role = payload.role
    from app.telemetry import event
    event(db, None, admin.id, "user.role_changed", {"user_id": user.id, "role": payload.role.value})
    db.commit()
    return user


@router.get("/me", response_model=UserOut)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get(
    "/users",
    response_model=List[UserOut],
    dependencies=[Depends(require_roles(Role.ADMIN))],
)
def list_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(Role.ADMIN))],
)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own administrative account",
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if user.projects:
        raise HTTPException(409, "Delete or transfer this user's projects first")
    if db.query(Deployment.id).filter_by(triggered_by_id=user.id).first():
        raise HTTPException(409, "User has deployment history; retain the account for attribution")
    db.query(AuthSession).filter_by(user_id=user.id).delete()
    db.delete(user)
    db.commit()

