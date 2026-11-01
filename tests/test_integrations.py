import importlib.util
from pathlib import Path
from unittest.mock import Mock
import pytest
import httpx
from app.cloud import ArchiveSink
from app.config import settings

spec=importlib.util.spec_from_file_location("collector",Path(__file__).resolve().parents[1]/"scripts/collect_prometheus.py")
collector=importlib.util.module_from_spec(spec);spec.loader.exec_module(collector)


def test_collector_rejects_missing_or_stale_data():
    queries={key:key for key in collector.FIELDS}
    def handle(request):
        return httpx.Response(200,json={"status":"success","data":{"resultType":"vector","result":[{"value":[1000,"1"]}]}})
    with httpx.Client(base_url="http://metrics",transport=httpx.MockTransport(handle)) as client:
        sample=collector.collect(client,queries,1000)
        assert sample["replicas"]==1
        with pytest.raises(ValueError,match="stale"):collector.collect(client,queries,1300)
    with httpx.Client(base_url="http://metrics",transport=httpx.MockTransport(lambda r:httpx.Response(200,json={"status":"success","data":{"resultType":"vector","result":[]}}))) as client:
        with pytest.raises(ValueError,match="exactly one"):collector.collect(client,queries,1000)


def test_archive_retries_use_stable_keys(monkeypatch):
    monkeypatch.setattr(settings,"archive_bucket","test-archive")
    monkeypatch.setattr(settings,"dynamodb_events_table","test-events")
    monkeypatch.setattr(settings,"opensearch_url","")
    session=Mock();sink=ArchiveSink(session)
    event={"id":"event1","data":{"rps":1.2}}
    sink.publish(event);sink.publish(event)
    calls=session.client.return_value.put_object.call_args_list
    assert calls[0]==calls[1]
    assert calls[0].kwargs["Key"]=="events/event1.json"
    assert str(session.resource.return_value.Table.return_value.put_item.call_args.kwargs["Item"]["data"]["rps"])=="1.2"
