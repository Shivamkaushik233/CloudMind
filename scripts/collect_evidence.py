"""Read bounded Kubernetes/PostgreSQL evidence and submit it to CloudMind."""
import argparse
import json
import os
import subprocess
import httpx


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for key in ["context","namespace","environment"]:parser.add_argument("--"+key,required=True)
    parser.add_argument("--api",default="http://localhost:8000")
    parser.add_argument("--database",action="store_true",help="Read pg_stat_database using CLOUDMIND_OBS_DATABASE_URL")
    args=parser.parse_args()
    base=["kubectl","--context",args.context,"--namespace",args.namespace,"--request-timeout=20s"]
    evidence=[]
    for resource in ["pods","events","deployments"]:
        response=subprocess.run(base+["get",resource,"-o","json"],check=True,capture_output=True,text=True,timeout=30)
        items=json.loads(response.stdout)["items"]
        if resource=="pods":
            data=[{"name":x["metadata"]["name"],"phase":x.get("status",{}).get("phase"),"containers":[{"name":c["name"],"ready":c.get("ready"),"restarts":c.get("restartCount"),"state":list(c.get("state",{}))} for c in x.get("status",{}).get("containerStatuses",[])]} for x in items[:20]]
        elif resource=="events":
            data=[{"reason":x.get("reason"),"type":x.get("type"),"count":x.get("count"),"lastTimestamp":x.get("lastTimestamp")} for x in items[-20:]]
        else:
            data=[{"name":x["metadata"]["name"],"replicas":x.get("spec",{}).get("replicas"),"ready":x.get("status",{}).get("readyReplicas",0)} for x in items[:20]]
        evidence.append(("kubernetes."+resource,data))
    if args.database:
        import psycopg
        with psycopg.connect(os.environ["CLOUDMIND_OBS_DATABASE_URL"],connect_timeout=10,options="-c default_transaction_read_only=on -c statement_timeout=5000") as connection:
            rows=connection.execute("SELECT datname,numbackends,xact_commit,xact_rollback,deadlocks,blks_read,blks_hit FROM pg_stat_database WHERE datname=current_database()").fetchall()
            evidence.append(("postgres.statistics",rows))
    with httpx.Client(base_url=args.api,headers={"Authorization":"Bearer "+os.environ["CLOUDMIND_TOKEN"]},timeout=30) as client:
        for service,data in evidence:
            message=json.dumps(data,default=str)
            # Bound entries instead of submitting truncated invalid JSON.
            while len(message)>3900 and data:
                data=data[:-1];message=json.dumps(data,default=str)
            response=client.post(f"/operations/{args.environment}/evidence",json={"kind":"log","service":service,"message":message,"severity":"info"})
            response.raise_for_status()
        print("Submitted",len(evidence),"evidence groups")
if __name__=="__main__":main()
