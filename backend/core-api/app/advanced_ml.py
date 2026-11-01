"""Trainable CPU XGBoost, LSTM, Transformer and Q-learning implementations.

Artifacts use JSON/NPZ rather than executable pickle. Neural models are small
baselines; evaluation reports measured holdout error, never promised accuracy.
"""
import json
import math
from pathlib import Path
from datetime import timedelta
import numpy as np

WINDOW = 24


def minute_series(rows):
    buckets = {}
    for row in rows:
        buckets.setdefault(row.timestamp.replace(second=0, microsecond=0), []).append(row.rps)
    timestamps = sorted(buckets)
    if len(timestamps) < 90:
        raise ValueError("Advanced models require at least 90 minutes of telemetry")
    values, times, missing = [], [], 0
    cursor = timestamps[0]
    while cursor <= timestamps[-1]:
        if cursor in buckets:
            values.append(float(np.mean(buckets[cursor]))); missing = 0
        else:
            missing += 1
            if missing > 5:
                raise ValueError("Telemetry gap exceeds five minutes")
            values.append(values[-1])
        times.append(cursor); cursor += timedelta(minutes=1)
    return np.array(values, dtype=np.float32), times


def neural_model(algorithm):
    import torch
    from torch import nn
    class ForecastNet(nn.Module):
        def __init__(self):
            super().__init__()
            if algorithm == "lstm":
                self.encoder = nn.LSTM(1, 24, batch_first=True)
                self.head = nn.Linear(24, 1)
            else:
                self.input = nn.Linear(1, 16)
                self.position = nn.Parameter(torch.zeros(1, WINDOW, 16))
                layer = nn.TransformerEncoderLayer(16, 2, dim_feedforward=32, dropout=0., batch_first=True)
                self.encoder = nn.TransformerEncoder(layer, 1, enable_nested_tensor=False)
                self.head = nn.Linear(16, 1)
        def forward(self, x):
            if algorithm == "lstm":
                out, _ = self.encoder(x)
            else:
                out = self.encoder(self.input(x)+self.position)
            return self.head(out[:, -1]).squeeze(-1)
    return ForecastNet()


def metrics(actual, predicted, baseline):
    residual = actual-predicted
    return {"mae": float(np.mean(np.abs(residual))), "rmse": float(np.sqrt(np.mean(residual**2))), "mape": float(np.mean(np.abs(residual)/np.maximum(actual, 1))*100), "persistence_mae": float(np.mean(np.abs(actual-baseline)))}


def train(rows, algorithm, directory, epochs=30):
    directory = Path(directory); directory.mkdir(parents=True, exist_ok=False)
    values, times = minute_series(rows)
    if algorithm == "qlearning":
        result = train_q_policy(values)
        (directory/"policy.json").write_text(json.dumps(result))
        return {"algorithm": algorithm, "samples": len(values), "training_steps": result["training_steps"], "note": "Experimental learned policy; runtime capacity and cooldown safeguards remain authoritative."}
    cut = int(len(values)*.8)
    mean, std = float(values[:cut].mean()), max(1., float(values[:cut].std()))
    normalized = (values-mean)/std
    x = np.array([normalized[i-WINDOW:i] for i in range(WINDOW,len(values))])
    y = normalized[WINDOW:]
    split = cut-WINDOW
    if algorithm == "xgboost":
        from xgboost import XGBRegressor
        model = XGBRegressor(n_estimators=80, max_depth=3, learning_rate=.06, n_jobs=1, random_state=7)
        model.fit(x[:split], y[:split])
        pred = model.predict(x[split:])*std+mean
        model.save_model(directory/"model.json")
    elif algorithm in {"lstm", "transformer"}:
        import torch
        torch.set_num_threads(1); torch.manual_seed(7)
        model = neural_model(algorithm)
        optimizer = torch.optim.Adam(model.parameters(), lr=.005)
        inputs = torch.from_numpy(x[:split,:,None]); targets = torch.from_numpy(y[:split])
        model.train()
        for _ in range(epochs):
            optimizer.zero_grad()
            loss = torch.nn.functional.mse_loss(model(inputs), targets)
            loss.backward(); torch.nn.utils.clip_grad_norm_(model.parameters(), 1.); optimizer.step()
        model.eval()
        with torch.no_grad():
            pred = model(torch.from_numpy(x[split:,:,None])).numpy()*std+mean
        np.savez_compressed(directory/"weights.npz", **{k:v.detach().numpy() for k,v in model.state_dict().items()})
    else:
        raise ValueError("Unknown model algorithm")
    pred = np.maximum(0,pred); actual = values[cut:]
    result = {"algorithm": algorithm, "mean": mean, "std": std, "samples": len(values), "trained_until": times[cut-1].isoformat()+"Z", "holdout_until": times[-1].isoformat()+"Z", "evaluation": metrics(actual,pred,values[cut-1:-1]), "residual_band": max(1.,float(np.quantile(np.abs(actual-pred),.9))), "epochs": epochs if algorithm != "xgboost" else None}
    (directory/"metadata.json").write_text(json.dumps(result))
    return result


def predict(rows, algorithm, directory, horizon=30):
    directory = Path(directory)
    metadata = json.loads((directory/"metadata.json").read_text())
    values, times = minute_series(rows)
    history = list(values)
    if algorithm == "xgboost":
        from xgboost import XGBRegressor
        model = XGBRegressor(); model.load_model(directory/"model.json")
        infer = lambda x: float(model.predict(x)[0])
    else:
        import torch
        model = neural_model(algorithm)
        with np.load(directory/"weights.npz",allow_pickle=False) as weights:
            model.load_state_dict({k:torch.from_numpy(weights[k]) for k in weights.files})
        model.eval()
        def infer(x):
            with torch.no_grad():
                return float(model(torch.from_numpy(x[:,:,None]))[0])
    points=[]
    for step in range(1,horizon+1):
        x=(np.array([history[-WINDOW:]],dtype=np.float32)-metadata["mean"])/metadata["std"]
        value=max(0.,min(infer(x)*metadata["std"]+metadata["mean"],max(values)*3+1))
        width=metadata["residual_band"]*math.sqrt(step)
        points.append({"timestamp":(times[-1]+timedelta(minutes=step)).isoformat()+"Z","rps":value,"lower":max(0,value-width),"upper":value+width})
        history.append(value)
    return {"model":algorithm,"points":points,"evaluation":metadata["evaluation"],"trained_samples":metadata["samples"],"interval_note":"Heuristic residual band; not a calibrated confidence interval.","evaluation_note":"Chronological 20% holdout, with no holdout fitting. Retrain after workload drift."}


def state(demand, replicas, scale):
    return min(19,int(demand/scale*19)), max(0,min(9,replicas-1))


def train_q_policy(values, episodes=150):
    rng=np.random.default_rng(7)
    q=np.zeros((20,10,3))
    training=values[:int(len(values)*.8)]
    scale=max(1.,float(np.max(training)))
    for episode in range(episodes):
        replicas=3
        for i,demand in enumerate(training[:-1]):
            s=state(demand,replicas,scale)
            action=int(rng.integers(3)) if rng.random()<max(.05,.5*(1-episode/episodes)) else int(np.argmax(q[s]))
            next_replicas=max(1,min(10,replicas+action-1))
            overload=max(0,float(demand)/(next_replicas*100)-.7)
            reward=-(next_replicas*.04+overload*4+abs(next_replicas-replicas)*.01)
            nxt=state(training[i+1],next_replicas,scale)
            q[s+(action,)]+=.1*(reward+.9*float(np.max(q[nxt]))-q[s+(action,)])
            replicas=next_replicas
    return {"q":q.tolist(),"scale":scale,"training_steps":episodes*(len(training)-1),"capacity_per_replica":100}


def q_recommend(path, demand, replicas):
    data=json.loads(Path(path).read_text()); q=np.array(data["q"])
    action=int(np.argmax(q[state(demand,replicas,data["scale"])]))-1
    return max(1,min(10,replicas+action))
