"""Forecasts and diagnostics derived from measured data; no remote model required."""
import math
from datetime import timedelta
import numpy as np
from sklearn.linear_model import Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler


def features(history, timestamp):
    return list(history[-12:]) + [float(np.mean(history[-12:]))]


def forecast(rows, horizon=30):
    # Minute buckets avoid treating different sampling intervals as equal timesteps.
    buckets = {}
    for row in rows:
        key = row.timestamp.replace(second=0, microsecond=0)
        buckets.setdefault(key, []).append(row.rps)
    times = sorted(buckets)
    if len(times) < 60:
        raise ValueError("At least 60 minutes of telemetry are required")
    series, grid = [], []
    cursor = times[0]
    missing = 0
    while cursor <= times[-1]:
        if cursor in buckets:
            series.append(float(np.mean(buckets[cursor])))
            missing = 0
        else:
            missing += 1
            if missing > 5:
                raise ValueError("Telemetry contains a gap longer than 5 minutes")
            series.append(series[-1])
        grid.append(cursor)
        cursor += timedelta(minutes=1)
    x = np.array([features(series[:i], grid[i]) for i in range(12, len(series))])
    y = np.array(series[12:])
    cut = max(24, int(len(y)*0.8))
    model = make_pipeline(StandardScaler(), Ridge(alpha=.01))
    model.fit(x[:cut], y[:cut])
    observed = y[cut:]
    pred = np.maximum(0, model.predict(x[cut:]))
    residual = observed-pred
    mae = float(np.mean(np.abs(residual)))
    rmse = float(np.sqrt(np.mean(residual**2)))
    baseline = x[cut:, 11]
    band = max(1., float(np.quantile(np.abs(residual), 0.9)))
    model.fit(x, y)
    history = list(series)
    points = []
    for step in range(1, horizon+1):
        ts = grid[-1] + timedelta(minutes=step)
        value = max(0., float(model.predict([features(history, ts)])[0]))
        # Bound recursive extrapolation against numerical explosions.
        value = min(value, max(series)*3+1)
        width = band * math.sqrt(step)
        points.append({"timestamp": ts.isoformat()+"Z", "rps": round(value, 2), "lower": round(max(0, value-width), 2), "upper": round(value+width, 2)})
        history.append(value)
    return {"model": "ridge-autoregressive-v1", "trained_samples": len(x), "points": points,
            "evaluation": {"mae": round(mae, 3), "rmse": round(rmse, 3), "mape": round(float(np.mean(np.abs(residual)/np.maximum(observed, 1)))*100, 3), "persistence_mae": round(float(np.mean(np.abs(observed-baseline))), 3), "test_samples": len(observed)},
            "interval_note": "Heuristic band based on held-out one-step residuals; not a calibrated confidence interval.",
            "evaluation_note": "Chronological final 20% one-step holdout; multi-step production accuracy is not established."}


def anomalies(rows):
    if len(rows) < 20:
        return []
    baseline = rows[:-5][-120:]
    latest = rows[-1]
    findings = []
    for key, floor in [("latency_ms", 150), ("error_rate", .02), ("cpu", 85)]:
        values = np.array([getattr(r, key) for r in baseline])
        median = float(np.median(values))
        spread = max(float(np.median(np.abs(values-median)))*1.4826, floor*.05)
        value = getattr(latest, key)
        threshold = max(floor, median+4*spread)
        if value > threshold:
            load = latest.rps > max(1., float(np.median([r.rps for r in baseline])))*1.5
            findings.append({"metric": key, "value": value, "threshold": round(threshold, 3), "severity": "critical" if value > threshold*2 else "warning", "classification": "load_driven" if load else "degradation", "timestamp": latest.timestamp.isoformat()+"Z"})
    return findings


def plan(rows, prediction, policy, cooldown=False):
    current = rows[-1]
    peak = max([p["upper"] for p in prediction["points"][:15]]+[current.rps])
    desired = math.ceil(peak/(policy["capacity_per_replica"]*policy["target_utilization"]))
    desired = max(policy["min_replicas"], min(policy["max_replicas"], desired))
    desired = max(current.replicas-policy["max_step"], min(current.replicas+policy["max_step"], desired))
    # Approach changed policy bounds gradually; max_step remains authoritative.
    reason = "Forecast upper envelope over the next 15 minutes, bounded by policy limits."
    if cooldown:
        desired, reason = current.replicas, "Cooldown active after a recent applied scaling decision."
    elif desired < current.replicas and (current.cpu > 70 or current.memory > 85 or current.error_rate > .02 or current.latency_ms > policy["latency_slo_ms"]):
        desired, reason = current.replicas, "Scale-down blocked while the environment is unhealthy."
    return {"current_replicas": current.replicas, "recommended_replicas": desired, "action": "scale_up" if desired > current.replicas else "scale_down" if desired < current.replicas else "hold", "reason": reason, "forecast_peak_rps": round(peak, 2), "estimated_hourly_cost": round(desired*policy["cost_per_replica_hour"], 4), "capacity_shortfall": peak > desired*policy["capacity_per_replica"]*policy["target_utilization"], "mode": policy["mode"]}
