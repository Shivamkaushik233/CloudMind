"""Explicit operator execution for a registered CloudMind environment.

Credentials stay in local kubeconfig; the web API cannot run arbitrary commands.
The operator chooses the context/namespace/deployment; dry-run is the default.
"""
import argparse
import json
import os
import subprocess
import httpx


def execute_scale(args, decision, runner=subprocess.run):
    if getattr(args, "spot_deployment", None):
        return execute_mix(args, decision, runner)
    base = ["kubectl", "--context", args.context, "--namespace", args.namespace, "--request-timeout=30s"]
    result = runner(base+["get", "deployment", args.deployment, "-o", "json"], check=True, capture_output=True, text=True, timeout=40)
    deployment = json.loads(result.stdout)
    current = deployment["spec"].get("replicas", 1)
    if current != decision["current_replicas"]:
        raise ValueError("Cluster replicas differ from telemetry; collect fresh measurements first")
    command = base+["scale", "deployment", args.deployment, f"--current-replicas={current}", f"--replicas={decision['recommended_replicas']}", "-o", "json"]
    if not args.apply:
        command += ["--dry-run=server"]
    runner(command, check=True, capture_output=True, text=True, timeout=40)
    return {"applied": args.apply, "context": args.context, "namespace": args.namespace, "deployment": args.deployment, "replicas": decision["recommended_replicas"]}


def execute_mix(args, decision, runner=subprocess.run):
    if args.deployment == args.spot_deployment:
        raise ValueError("Capacity pools must use distinct deployments")
    mix=decision["capacity_mix"]
    base=["kubectl","--context",args.context,"--namespace",args.namespace,"--request-timeout=30s"]
    pools=[]
    for name,key,label in [(args.deployment,"on_demand","on-demand"),(args.spot_deployment,"spot","spot")]:
        result=runner(base+["get","deployment",name,"-o","json"],check=True,capture_output=True,text=True,timeout=40)
        spec=json.loads(result.stdout)["spec"]
        if spec["template"]["spec"].get("nodeSelector",{}).get("capacity")!=label:
            raise ValueError("Deployment must select the corresponding capacity node group")
        current=spec.get("replicas",1);target=mix[key]
        if not isinstance(target,int) or target<0:raise ValueError("Invalid capacity mix")
        pools.append((name,current,target))
    if sum(p[1] for p in pools)!=decision["current_replicas"] or sum(p[2] for p in pools)!=decision["recommended_replicas"]:
        raise ValueError("Capacity pool totals differ from telemetry or recommendation")
    # Preflight both writes before changing either pool.
    def command(pool):
        name,current,target=pool
        return base+["scale","deployment",name,f"--current-replicas={current}",f"--replicas={target}","-o","json"]
    for pool in pools:
        runner(command(pool)+["--dry-run=server"],check=True,capture_output=True,text=True,timeout=40)
    if args.apply:
        try:
            # Grow first, and wait for readiness before reducing the other pool.
            for pool in sorted(pools,key=lambda p:p[2]-p[1],reverse=True):
                if pool[1]==pool[2]:continue
                runner(command(pool),check=True,capture_output=True,text=True,timeout=40)
                if pool[2]>pool[1]:
                    runner(base+["rollout","status","deployment/"+pool[0],"--timeout=120s"],check=True,capture_output=True,text=True,timeout=130)
        except Exception as exc:
            raise RuntimeError("Capacity change may be partial. Stop and reconcile both deployments before retrying.") from exc
    return {"applied":args.apply,"context":args.context,"namespace":args.namespace,"deployment":args.deployment+","+args.spot_deployment,"replicas":decision["recommended_replicas"]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api", default="http://localhost:8000")
    for name in ["environment", "context", "namespace", "deployment"]:
        parser.add_argument("--"+name, required=True)
    parser.add_argument("--spot-deployment", help="Optional second workload pinned to capacity=spot; primary must select capacity=on-demand")
    parser.add_argument("--apply", action="store_true", help="Perform the real cluster change; otherwise server-side dry-run")
    args = parser.parse_args()
    token = os.environ.get("CLOUDMIND_TOKEN")
    if not token:
        parser.error("Set CLOUDMIND_TOKEN to an operator access token")
    with httpx.Client(base_url=args.api, headers={"Authorization": "Bearer "+token}, timeout=30) as client:
        me = client.get('/auth/me'); me.raise_for_status()
        if me.json()['role'] not in ['ADMIN', 'DEVOPS']:
            parser.error('Kubernetes execution requires an ADMIN or DEVOPS account')
        policy = client.get(f"/operations/{args.environment}/policy"); policy.raise_for_status()
        if policy.json()["mode"] != "kubernetes":
            parser.error("Environment policy must use kubernetes mode")
        response = client.post(f"/operations/{args.environment}/scaling/plan"); response.raise_for_status()
        decision = response.json()
        print(json.dumps(decision, indent=2))
        result = execute_scale(args, decision)
        print(json.dumps(result, indent=2))
        if args.apply:
            response = client.post(f"/operations/{args.environment}/scaling/{decision['id']}/record", json=result)
            if not response.is_success:
                raise SystemExit("Cluster was scaled, but audit recording failed. Do not repeat the scale; reconcile the event manually.")


if __name__ == "__main__":
    main()
