"""Continuous operator. Dry-run by default; failures stop execution for reconciliation."""
import argparse
import os
import signal
import time
import httpx
from kubernetes_scale import execute_scale

running=True
def stop(*_):
    global running
    running=False

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ["context","namespace","deployment","environment"]:parser.add_argument("--"+name,required=True)
    parser.add_argument("--api",default="http://localhost:8000")
    parser.add_argument("--interval",type=int,default=60)
    parser.add_argument("--spot-deployment")
    parser.add_argument("--apply",action="store_true")
    args=parser.parse_args()
    if args.interval<30:parser.error("Interval must be at least 30 seconds")
    token=os.environ["CLOUDMIND_TOKEN"]
    signal.signal(signal.SIGINT,stop);signal.signal(signal.SIGTERM,stop)
    with httpx.Client(base_url=args.api,headers={"Authorization":"Bearer "+token},timeout=30) as client:
        me=client.get("/auth/me");me.raise_for_status()
        if me.json()["role"] not in {"ADMIN","DEVOPS"}:raise SystemExit("Operator role required")
        while running:
            policy=client.get(f"/operations/{args.environment}/policy");policy.raise_for_status()
            if policy.json()["mode"]!="kubernetes":raise SystemExit("Kubernetes mode required")
            response=client.post(f"/operations/{args.environment}/scaling/plan");response.raise_for_status();decision=response.json()
            if decision["recommended_replicas"]!=decision["current_replicas"]:
                receipt=execute_scale(args,decision)
                if args.apply:
                    response=client.post(f"/operations/{args.environment}/scaling/{decision['id']}/record",json=receipt)
                    if not response.is_success:raise SystemExit("Scale applied but receipt failed. Stop and reconcile before restarting.")
            deadline=time.monotonic()+args.interval
            while running and time.monotonic()<deadline:time.sleep(min(1,deadline-time.monotonic()))
if __name__=="__main__":main()
