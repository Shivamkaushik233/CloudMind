import math
from datetime import datetime, timedelta
from app.models import gen_id
from app.operations_models import Metric, Event, DemoState

FIELDS = ["cpu", "memory", "rps", "latency_ms", "error_rate", "replicas", "cost_per_hour"]


def event(db, env_id, actor_id, kind, data):
    record = Event(environment_id=env_id, actor_id=actor_id, kind=kind, data=data)
    db.add(record)
    db.flush()
    return record


def simulated_sample(env_id, ts, replicas=3, incident=False):
    minute = ts.timestamp()/60
    # Deterministic traffic signal supports reproducible regressions.
    rps = max(20., 140+90*math.sin(minute/70)+35*math.sin(minute/13))
    utilization = rps/(replicas*100)
    return Metric(id=gen_id(), environment_id=env_id, timestamp=ts, source="simulated", rps=rps,
                  cpu=min(99., utilization*85), memory=min(97., 35+utilization*25), replicas=replicas,
                  latency_ms=35+max(0., utilization-.7)*300+(450 if incident else 0),
                  error_rate=min(.99, max(0., utilization-1)*.15+(.08 if incident else 0)), cost_per_hour=replicas*.04)


def advance_demo(db, state):
    now = datetime.utcnow().replace(second=0, microsecond=0)
    start = max(state.last_sample+timedelta(minutes=1), now-timedelta(hours=24)) if state.last_sample else now-timedelta(hours=6)
    while start <= now:
        existing = db.query(Metric.id).filter_by(environment_id=state.environment_id, timestamp=start, source="simulated").first()
        if not existing:
            db.add(simulated_sample(state.environment_id, start, state.replicas, bool(state.incident_until and start <= state.incident_until and start > state.incident_until-timedelta(minutes=10))))
        start += timedelta(minutes=1)
    state.last_sample = now
    db.commit()


def metric_dict(row):
    return {"timestamp": row.timestamp.isoformat()+"Z", "source": row.source, **{key: getattr(row, key) for key in FIELDS}}
