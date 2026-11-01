from datetime import datetime, timedelta
from app.telemetry import simulated_sample
from app.intelligence import forecast, anomalies, plan
from app.routers.operations import ScalingPolicy


def history():
    end = datetime(2026,10,1,12,0)
    return [simulated_sample('test', end-timedelta(minutes=360-i)) for i in range(361)]


def test_forecast_uses_held_out_future_and_valid_bounds():
    result = forecast(history(),60)
    assert result['evaluation']['test_samples'] > 50
    assert result['evaluation']['mae'] < result['evaluation']['persistence_mae']
    assert len(result['points']) == 60


def test_gap_rejected():
    import pytest
    rows = history()
    with pytest.raises(ValueError, match='gap'):
        forecast(rows[:50]+rows[70:])


def test_capacity_bounds_and_cooldown():
    rows = history()
    policy = ScalingPolicy(min_replicas=1,max_replicas=5,max_step=2).model_dump()
    result = plan(rows,forecast(rows),policy)
    assert 1 <= result['recommended_replicas'] <= 5
    held = plan(rows,forecast(rows),policy,cooldown=True)
    assert held['recommended_replicas'] == rows[-1].replicas


def test_degradation_detected():
    rows = history()
    rows[-1].latency_ms=1200
    rows[-1].error_rate=.2
    assert {x['metric'] for x in anomalies(rows)} >= {'latency_ms','error_rate'}


def test_changed_bounds_never_bypass_max_step():
    rows=history();rows[-1].replicas=20
    rows[-1].cpu=10;rows[-1].memory=10;rows[-1].error_rate=0;rows[-1].latency_ms=20
    policy=ScalingPolicy(min_replicas=1,max_replicas=5,max_step=2).model_dump()
    assert plan(rows,forecast(rows),policy)["recommended_replicas"]==18
    rows[-1].replicas=1
    policy=ScalingPolicy(min_replicas=10,max_replicas=20,max_step=2).model_dump()
    assert plan(rows,forecast(rows),policy)["recommended_replicas"]==3


def test_memory_pressure_blocks_scale_down():
    rows=history();rows[-1].replicas=10;rows[-1].cpu=10;rows[-1].memory=95
    rows[-1].error_rate=0;rows[-1].latency_ms=20
    result=plan(rows,{"points":[{"upper":1}]},ScalingPolicy().model_dump())
    assert result["recommended_replicas"]==10
