import hashlib
from datetime import datetime,timedelta
from app.main import app
from app.database import get_db
from app.models import User
from app.operations_models import LoginExchange
from app.config import settings
from .test_api import register_and_login
from .test_operations import environment


def test_oidc_exchange_is_single_use(client):
    register_and_login(client)
    code="a"*40
    with next(app.dependency_overrides[get_db]()) as db:
        user=db.query(User).first()
        db.add(LoginExchange(code_hash=hashlib.sha256(code.encode()).hexdigest(),user_id=user.id,expires_at=datetime.utcnow()+timedelta(seconds=90)))
        db.commit()
    response=client.post("/auth/oidc/exchange",json={"code":code})
    assert response.status_code==200
    assert client.get("/auth/me",headers={"Authorization":"Bearer "+response.json()["access_token"]}).status_code==200
    assert client.post("/auth/oidc/exchange",json={"code":code}).status_code==401


def test_auth_rate_limit_keeps_cors(client,monkeypatch):
    monkeypatch.setattr(settings,"auth_rate_limit",0)
    response=client.post("/auth/login",data={"username":"missing@example.com","password":"invalid"},headers={"Origin":"http://localhost:3000"})
    assert response.status_code==429
    assert response.headers["access-control-allow-origin"]=="http://localhost:3000"


def test_model_training_and_tenant_isolation(client,monkeypatch,tmp_path):
    monkeypatch.setattr(settings,"model_store",str(tmp_path))
    owner=register_and_login(client)
    env=environment(client,owner)
    base=f"/operations/{env}"
    assert client.post(base+"/simulation",headers=owner).status_code==200
    result=client.post(base+"/models/train",headers=owner,json={"algorithm":"xgboost"})
    assert result.status_code==201,result.text
    assert client.get(base+"/forecast?algorithm=xgboost",headers=owner).status_code==200
    other=register_and_login(client,"other@example.com")
    assert client.get(base+"/models",headers=other).status_code==403
    assert client.post(base+"/models/train",headers=other,json={"algorithm":"lstm"}).status_code==403


def test_oidc_rejects_truthy_non_boolean_verified_claim(client,monkeypatch):
    from app.routers import oidc
    from types import SimpleNamespace
    monkeypatch.setattr(settings,"oidc_issuer","https://issuer.example")
    async def token(request):
        return {"userinfo":{"iss":"https://issuer.example","sub":"someone","email":"person@example.com","email_verified":"false"}}
    monkeypatch.setattr(oidc,"provider",lambda:SimpleNamespace(authorize_access_token=token))
    assert client.get("/auth/oidc/callback").status_code==401
