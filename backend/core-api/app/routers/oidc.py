import hashlib
import secrets
from datetime import datetime,timedelta
from fastapi import APIRouter,Request,Depends,HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel,Field
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import User,Role
from app.operations_models import OIDCIdentity,LoginExchange
from app.auth import hash_password
from app.sessions import issue

router=APIRouter(prefix='/auth/oidc',tags=['oidc'])


def provider():
    if not settings.oidc_issuer or not settings.oidc_client_id:
        raise HTTPException(503,'OIDC is not configured')
    from authlib.integrations.starlette_client import OAuth
    oauth=OAuth()
    return oauth.register('identity',client_id=settings.oidc_client_id,client_secret=settings.oidc_client_secret,server_metadata_url=settings.oidc_issuer.rstrip('/')+'/.well-known/openid-configuration',client_kwargs={'scope':'openid email profile','code_challenge_method':'S256'})


@router.get('/login')
async def login(request:Request):
    return await provider().authorize_redirect(request,settings.public_api_url.rstrip('/')+'/auth/oidc/callback')


@router.get('/callback')
async def callback(request:Request,db:Session=Depends(get_db)):
    try:
        token=await provider().authorize_access_token(request)
        claims=token.get('userinfo')
        if not claims or claims.get('iss') != settings.oidc_issuer or claims.get('email_verified') is not True or not claims.get('sub'):
            raise ValueError('Unverified identity')
    except Exception:
        raise HTTPException(401,'Identity provider validation failed')
    identity=db.query(OIDCIdentity).filter_by(issuer=settings.oidc_issuer,subject=claims['sub']).first()
    if identity:
        user=db.get(User,identity.user_id)
    else:
        email=claims.get('email','')
        if not email or db.query(User).filter_by(email=email).first():
            raise HTTPException(409,'Existing email cannot be automatically linked to this identity')
        user=User(email=email,full_name=claims.get('name',email),role=Role.DEVELOPER,hashed_password=hash_password(secrets.token_urlsafe(32)))
        db.add(user);db.flush();db.add(OIDCIdentity(user_id=user.id,issuer=settings.oidc_issuer,subject=claims['sub']))
    code=secrets.token_urlsafe(32)
    db.add(LoginExchange(code_hash=hashlib.sha256(code.encode()).hexdigest(),user_id=user.id,expires_at=datetime.utcnow()+timedelta(seconds=90)))
    db.commit()
    return RedirectResponse(settings.frontend_url.rstrip('/')+'/?login_code='+code,status_code=303)


class Exchange(BaseModel):
    code:str=Field(min_length=20,max_length=100)


@router.post('/exchange')
def exchange(body:Exchange,db:Session=Depends(get_db)):
    digest=hashlib.sha256(body.code.encode()).hexdigest()
    row=db.get(LoginExchange,digest)
    if not row or row.expires_at<datetime.utcnow():raise HTTPException(401,'Invalid login exchange')
    user=db.get(User,row.user_id)
    deleted=db.query(LoginExchange).filter_by(code_hash=digest).delete()
    if deleted!=1 or not user:raise HTTPException(401,'Login exchange already consumed')
    return issue(db,user)


@router.get("/config")
def configuration():
    return {"enabled":bool(settings.oidc_issuer and settings.oidc_client_id)}
