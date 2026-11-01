from datetime import datetime, timedelta
from types import SimpleNamespace
import math
import pytest
from app.advanced_ml import train, predict, minute_series, q_recommend

def history():
    return [SimpleNamespace(timestamp=datetime(2026,1,1)+timedelta(minutes=i),rps=100+20*math.sin(i/10)) for i in range(120)]

@pytest.mark.parametrize('algorithm',['xgboost','lstm','transformer'])
def test_real_training_and_safe_artifact_roundtrip(tmp_path,algorithm):
    directory=tmp_path/algorithm
    report=train(history(),algorithm,directory,epochs=2)
    result=predict(history(),algorithm,directory,horizon=3)
    assert report['evaluation']['mae']>=0
    assert report['trained_until']<report['holdout_until']
    assert len(result['points'])==3
    assert all(math.isfinite(p['rps']) and p['lower']<=p['rps']<=p['upper'] for p in result['points'])
    assert not list(directory.glob('*.pkl'))

def test_q_policy_and_telemetry_gap(tmp_path):
    train(history(),'qlearning',tmp_path/'q')
    assert 2<=q_recommend(tmp_path/'q/policy.json',100,3)<=4
    with pytest.raises(ValueError,match='gap'):
        minute_series(history()[:50]+history()[60:])
