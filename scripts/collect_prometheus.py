"""Collect real Prometheus measurements using an explicit query map; no fallback data."""
import argparse
import json
import math
import os
from datetime import datetime, timezone
from pathlib import Path
import httpx

FIELDS={"cpu","memory","rps","latency_ms","error_rate","replicas","cost_per_hour"}

def collect(client,queries,now):
    if set(queries)!=FIELDS: raise ValueError("Query map must contain exactly: "+", ".join(sorted(FIELDS)))
    sample={"timestamp":datetime.fromtimestamp(now,timezone.utc).isoformat()}
    for field,query in queries.items():
        response=client.get("/api/v1/query",params={"query":query,"time":now});response.raise_for_status()
        data=response.json()
        if data.get("status")!="success" or data["data"]["resultType"]!="vector" or len(data["data"]["result"])!=1:
            raise ValueError(field+": query must return exactly one current series")
        timestamp,value=data["data"]["result"][0]["value"];value=float(value)
        if not math.isfinite(value) or now-float(timestamp)>120 or float(timestamp)>now+10:
            raise ValueError(field+": invalid or stale measurement")
        if field=="replicas" and not value.is_integer(): raise ValueError("Replicas must be an integer")
        sample[field]=int(value) if field=="replicas" else value
    return sample

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--queries",type=Path,required=True)
    parser.add_argument("--prometheus",required=True)
    parser.add_argument("--api",default="http://localhost:8000")
    parser.add_argument("--environment",required=True)
    args=parser.parse_args()
    token=os.environ["CLOUDMIND_TOKEN"]
    with httpx.Client(base_url=args.prometheus,timeout=15) as client:
        sample=collect(client,json.loads(args.queries.read_text()),datetime.now(timezone.utc).timestamp())
    response=httpx.post(args.api+"/operations/"+args.environment+"/metrics",headers={"Authorization":"Bearer "+token},json={"samples":[sample]},timeout=30)
    response.raise_for_status();print(response.json())
if __name__=="__main__":main()
