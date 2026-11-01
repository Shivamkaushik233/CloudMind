from datetime import datetime, timedelta, timezone
import pytest
from app.config import settings
from app.main import app
from app.database import get_db
from app.models import User, Role
from app.operations_models import Event, Metric, DemoState
from .test_api import register_and_login


def environment(client, headers):
    p = client.post('/projects', json={'name':'Test'}, headers=headers).json()['id']
    a = client.post(f'/projects/{p}/applications', json={'name':'checkout'}, headers=headers).json()['id']
    return client.post(f'/applications/{a}/environments', json={'name':'test'}, headers=headers).json()['id']


def test_public_admin_registration_denied(client):
    r = client.post('/auth/register', json={'email':'evil@example.com','full_name':'Evil','password':'long-password','role':'ADMIN'})
    assert r.status_code == 403


def test_refresh_rotation_and_logout(client):
    register_and_login(client)
    tokens = client.post('/auth/login', data={'username':'dev@cloudmind.io','password':'sup3rsecret'}).json()
    rotated = client.post('/auth/refresh', json={'refresh_token':tokens['refresh_token']})
    assert rotated.status_code == 200
    assert client.post('/auth/refresh', json={'refresh_token':tokens['refresh_token']}).status_code == 401
    assert client.post('/auth/logout', json={'refresh_token':rotated.json()['refresh_token']}).status_code == 204
    for token in [tokens['access_token'], rotated.json()['access_token']]:
        assert client.get('/auth/me', headers={'Authorization':f'Bearer {token}'}).status_code == 401


def test_full_operations_workflow(client):
    h = register_and_login(client)
    env = environment(client, h)
    base = f'/operations/{env}'
    assert client.get(base+'/forecast', headers=h).status_code == 409
    assert client.post(base+'/simulation', headers=h).status_code == 200
    data = client.get(base+'/metrics', headers=h).json()
    assert data['summary']['samples'] >= 360
    assert data['summary']['latest']['source'] == 'simulated'
    forecast = client.get(base+'/forecast', headers=h)
    assert forecast.status_code == 200, forecast.text
    assert len(forecast.json()['points']) == 30
    assert all(0 <= p['lower'] <= p['rps'] <= p['upper'] for p in forecast.json()['points'])
    assert client.post(base+'/simulation/incident', headers=h).status_code == 200
    anomalies = client.get(base+'/anomalies', headers=h).json()
    assert any(a['metric'] == 'latency_ms' for a in anomalies)
    result = client.post(base+'/investigate', headers=h, json={'question':'Why is checkout slow?'})
    assert result.status_code == 200
    assert result.json()['engine'] == 'evidence-rules'
    assert result.json()['evidence']['anomalies']
    assert client.put(base+'/policy', headers=h, json={'mode':'simulation','min_replicas':5,'max_replicas':10}).status_code == 200
    decision = client.post(base+'/scaling/plan', headers=h).json()
    applied = client.post(base+f'/scaling/{decision["id"]}/apply', headers=h)
    assert applied.status_code == 200, applied.text
    assert applied.json()['replicas'] >= 5
    assert client.post(base+f'/scaling/{decision["id"]}/apply', headers=h).status_code == 404
    assert 'timestamp,source,cpu' in client.get(base+'/metrics.csv', headers=h).text
    events = client.get(base+'/events', headers=h).json()
    assert any(e['kind'] == 'scaling.applied' for e in events)


def test_tenant_isolation(client):
    a = register_and_login(client, 'a@example.com')
    b = register_and_login(client, 'b@example.com')
    env = environment(client, a)
    for path in ['metrics','forecast','anomalies','events','policy','metrics.csv']:
        assert client.get(f'/operations/{env}/{path}', headers=b).status_code == 403
    for path in ['simulation','scaling/plan']:
        assert client.post(f'/operations/{env}/{path}', headers=b).status_code == 403
    assert client.get('/operations/environments', headers=b).json() == []


def samples(count=70):
    return [{'timestamp':(datetime.now(timezone.utc)-timedelta(minutes=count-i-1)).isoformat(), 'cpu':40,'memory':50,'rps':100+i,'latency_ms':45,'error_rate':.001,'replicas':3,'cost_per_hour':.12} for i in range(count)]


def test_ingestion_validation_deduplication_and_staleness(client):
    h = register_and_login(client)
    env = environment(client,h)
    data = {'samples':samples()}
    url = f'/operations/{env}/metrics'
    assert client.post(url, json=data, headers=h).json()['inserted'] == 70
    assert client.post(url, json=data, headers=h).json()['duplicates'] == 70
    assert client.get(f'/operations/{env}/forecast', headers=h).status_code == 200
    assert client.post(f'/operations/{env}/simulation', headers=h).status_code == 409
    data['samples'][0]['cpu'] = 101
    assert client.post(url, json=data, headers=h).status_code == 422
    with next(app.dependency_overrides[get_db]()) as db:
        for row in db.query(Metric).all():
            row.timestamp -= timedelta(hours=2)
        db.commit()
    assert client.post(f'/operations/{env}/scaling/plan', headers=h).status_code == 409


def test_viewer_cannot_mutate(client):
    h = register_and_login(client)
    env = environment(client,h)
    with next(app.dependency_overrides[get_db]()) as db:
        db.query(User).one().role = Role.VIEWER
        db.commit()
    assert client.get(f'/operations/{env}/metrics', headers=h).status_code == 200
    assert client.post(f'/operations/{env}/simulation', headers=h).status_code == 403
    assert client.post('/projects', json={'name':'no'}, headers=h).status_code == 403
    assert client.delete(f'/environments/{env}', headers=h).status_code == 403


def test_invalid_policy_and_protected_scrape(client, monkeypatch):
    h = register_and_login(client)
    env = environment(client,h)
    assert client.put(f'/operations/{env}/policy', headers=h, json={'min_replicas':8,'max_replicas':2}).status_code == 422
    assert client.get('/metrics').status_code == 401
    monkeypatch.setattr(settings,'metrics_scrape_token','test-scrape-token')
    assert client.get('/metrics', headers={'Authorization':'Bearer test-scrape-token'}).status_code == 200


def test_demo_and_provider_failure(client, monkeypatch):
    h = register_and_login(client)
    monkeypatch.setattr(settings,'demo_enabled',True)
    env = client.post('/demo', headers=h).json()['environment_id']
    assert client.post('/demo', headers=h).json()['environment_id'] == env
    monkeypatch.setattr(settings,'anthropic_api_key','')
    assert client.post(f'/operations/{env}/investigate', headers=h, json={'use_llm':True}).status_code == 409


def test_simulation_never_accepts_real_samples(client):
    h = register_and_login(client)
    env = environment(client,h)
    client.post(f'/operations/{env}/simulation', headers=h)
    assert client.post(f'/operations/{env}/metrics', headers=h, json={'samples':samples(1)}).status_code == 409


def test_scaling_cooldown_uses_updated_replica_count(client):
    h=register_and_login(client)
    env=environment(client,h)
    base=f'/operations/{env}'
    client.post(base+'/simulation',headers=h)
    client.put(base+'/policy',headers=h,json={'mode':'simulation','min_replicas':5,'max_replicas':10})
    decision=client.post(base+'/scaling/plan',headers=h).json()
    result=client.post(base+f'/scaling/{decision["id"]}/apply',headers=h)
    assert result.status_code == 200
    following=client.post(base+'/scaling/plan',headers=h).json()
    assert following['action']=='hold'
    assert following['current_replicas']==result.json()['replicas']
    assert 'Cooldown' in following['reason']


def test_evidence_and_cascade_deletion(client):
    h=register_and_login(client)
    env=environment(client,h)
    base=f'/operations/{env}'
    client.post(base+'/simulation',headers=h)
    r=client.post(base+'/evidence',headers=h,json={'kind':'log','message':'upstream timeout','severity':'error'})
    assert r.status_code == 201
    investigation=client.post(base+'/investigate',headers=h,json={}).json()
    assert investigation['evidence']['logs_and_traces'][0]['message']=='upstream timeout'
    assert client.delete(f'/environments/{env}',headers=h).status_code == 204
    with next(app.dependency_overrides[get_db]()) as db:
        assert db.query(Metric).count()==0
        assert db.query(DemoState).count()==0
        assert db.query(Event).filter_by(environment_id=env).count()==0


def test_worker_publishes_after_ack(client):
    from app.worker import publish_batch
    h=register_and_login(client)
    env=environment(client,h)
    client.post(f'/operations/{env}/evidence',headers=h,json={'kind':'trace','message':'db wait 900ms'})
    sent=[]
    class Future:
        def get(self,timeout):
            return True
    class Producer:
        def send(self,topic,**kwargs):
            sent.append((topic,kwargs))
            return Future()
    with next(app.dependency_overrides[get_db]()) as db:
        assert publish_batch(db,Producer())==1
        assert publish_batch(db,Producer())==0
        assert sent[0][0]=='cloudmind.events'


def test_worker_failure_keeps_outbox_retryable(client):
    from app.worker import publish_batch
    h=register_and_login(client)
    env=environment(client,h)
    client.post(f'/operations/{env}/evidence',headers=h,json={'kind':'log','message':'retry'})
    class Future:
        def get(self,timeout):
            raise TimeoutError('broker unavailable')
    class Producer:
        def send(self,*args,**kwargs): return Future()
    with next(app.dependency_overrides[get_db]()) as db:
        with pytest.raises(TimeoutError): publish_batch(db,Producer())
        db.rollback()
        assert db.query(Event).filter_by(published=0).count()==1
