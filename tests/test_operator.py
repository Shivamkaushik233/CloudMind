import importlib.util
import json
from pathlib import Path
from types import SimpleNamespace
import pytest

spec=importlib.util.spec_from_file_location('kubernetes_scale',Path(__file__).resolve().parents[1]/'scripts/kubernetes_scale.py')
operator=importlib.util.module_from_spec(spec)
spec.loader.exec_module(operator)


def test_operator_dry_run_and_precondition():
    calls=[]
    def run(cmd,**kwargs):
        calls.append(cmd)
        return SimpleNamespace(stdout=json.dumps({'spec':{'replicas':3}}))
    args=SimpleNamespace(context='test',namespace='test',deployment='checkout',apply=False)
    result=operator.execute_scale(args,{'current_replicas':3,'recommended_replicas':5},run)
    assert not result['applied']
    assert '--dry-run=server' in calls[-1]
    assert '--current-replicas=3' in calls[-1]
    with pytest.raises(ValueError,match='differ'):
        operator.execute_scale(args,{'current_replicas':2,'recommended_replicas':5},run)


def test_operator_apply_is_explicit():
    calls=[]
    def run(cmd,**kwargs):
        calls.append(cmd)
        return SimpleNamespace(stdout=json.dumps({'spec':{'replicas':3}}))
    args=SimpleNamespace(context='test',namespace='test',deployment='checkout',apply=True)
    assert operator.execute_scale(args,{'current_replicas':3,'recommended_replicas':4},run)['applied']
    assert '--dry-run=server' not in calls[-1]


def test_capacity_mix_preflight_and_growth_before_reduction():
    calls=[]
    def run(cmd,**kwargs):
        calls.append(cmd)
        if "get" in cmd:
            name=cmd[cmd.index("deployment")+1]
            return SimpleNamespace(stdout=json.dumps({"spec":{"replicas":3 if name=="primary" else 1,"template":{"spec":{"nodeSelector":{"capacity":"on-demand" if name=="primary" else "spot"}}}}}))
        return SimpleNamespace(stdout="{}")
    args=SimpleNamespace(context="test",namespace="test",deployment="primary",spot_deployment="spot",apply=True)
    decision={"current_replicas":4,"recommended_replicas":4,"capacity_mix":{"on_demand":2,"spot":2}}
    assert operator.execute_scale(args,decision,run)["replicas"]==4
    writes=[c for c in calls if "scale" in c and "--dry-run=server" not in c]
    assert writes[0][writes[0].index("deployment")+1]=="spot"
    assert writes[1][writes[1].index("deployment")+1]=="primary"
    assert any("rollout" in c for c in calls)
