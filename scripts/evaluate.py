"""Reproducible synthetic regression evaluation; not a production benchmark."""
import argparse
import json
import math
import sys
from datetime import datetime, timedelta
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'backend/core-api'))
from app.telemetry import simulated_sample
from app.intelligence import forecast, anomalies


def evaluate():
    end = datetime(2026,10,1,12)
    rows = [simulated_sample('evaluation', end-timedelta(minutes=720-i)) for i in range(721)]
    report = forecast(rows)['evaluation']
    tp=fp=fn=0
    for i in range(120,len(rows),20):
        window=rows[:i+1]
        injected=(i//20)%3==0
        if injected:
            window[-1].latency_ms += 600
            window[-1].error_rate += .1
        detected=bool(anomalies(window))
        tp += int(injected and detected); fp += int(not injected and detected); fn += int(injected and not detected)
        if injected:
            window[-1].latency_ms -= 600
            window[-1].error_rate -= .1
    precision=tp/max(1,tp+fp); recall=tp/max(1,tp+fn)
    costs={}
    for strategy in ['reactive_cpu_70_percent','cloudmind_forecast']:
        replicas=3; events=0; violations=0; total_cost=0; last_change=-100
        latencies=[]; cpus=[]
        for i in range(120,len(rows)):
            row=rows[i]
            utilization=row.rps/(replicas*100)
            latency=35+max(0,utilization-.7)*300
            latencies.append(latency); cpus.append(min(100,utilization*85))
            violations += int(latency>200)
            total_cost += replicas*.04/60
            if i-last_change < 5 or i%5:
                continue
            if strategy=='cloudmind_forecast':
                # Receding horizon: only observations available at this minute.
                demand=max(p['upper'] for p in forecast(rows[max(0,i-360):i+1],15)['points'])
                wanted=max(1,min(10,math.ceil(demand/70)))
            else:
                wanted=max(1,min(10,math.ceil(row.rps/70))) if utilization>.7 or utilization<.3 else replicas
            wanted=max(replicas-3,min(replicas+3,wanted))
            if wanted != replicas:
                events+=1; last_change=i
            replicas=wanted
        costs[strategy]={'cost':round(total_cost,4),'scaling_events':events,'sla_violations':violations,'average_latency_ms':round(sum(latencies)/len(latencies),3),'peak_latency_ms':round(max(latencies),3),'average_cpu_percent':round(sum(cpus)/len(cpus),3)}
    return {'dataset':'deterministic synthetic traffic, 12 hours; first 2 hours warm-up','forecast_one_step_holdout':report,'anomaly_detection':{'precision':precision,'recall':recall,'f1':2*precision*recall/max(1e-9,precision+recall),'true_positives':tp,'false_positives':fp,'false_negatives':fn},'capacity_simulation':costs,'limitations':['Synthetic incidents are deliberately obvious; model parameters were tuned on this simulator.','The reactive comparator is a simplified CPU rule, not the Kubernetes HPA implementation.','The harness assumes one-minute actuation and does not model pod startup or node provisioning.','No production performance or cost-saving claim is made.']}


if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--output',type=Path)
    args=parser.parse_args(); result=json.dumps(evaluate(),indent=2)
    print(result)
    if args.output: args.output.write_text(result+'\n')
