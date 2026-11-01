# API guide

The interactive schema at `/docs` is the authoritative request/response reference.

1. `POST /auth/register`: JSON `email`, `full_name`, `password`; role defaults to DEVELOPER.
2. `POST /auth/login`: form data `username=<email>&password=<password>`.
3. Send `Authorization: Bearer <access_token>` on authenticated calls.
4. `POST /auth/refresh`: JSON `refresh_token`; replace both returned tokens. Refresh tokens rotate and last seven days. The console coordinates concurrent refresh requests within one tab.
5. `POST /auth/logout`: JSON `refresh_token`; immediately revokes that session's access and refresh tokens.

Create `/projects`, `/projects/{id}/applications` and `/applications/{id}/environments` before telemetry ingestion, or enable `DEMO_ENABLED` and call `POST /demo`.

## Metric batch

`POST /operations/{environment_id}/metrics`

```json
{
  "samples": [{
    "timestamp": "2026-10-29T12:00:00Z",
    "cpu": 45.2,
    "memory": 61.0,
    "rps": 135.5,
    "latency_ms": 48.0,
    "error_rate": 0.002,
    "replicas": 3,
    "cost_per_hour": 0.12
  }]
}
```

Use the actual current timestamp; old/future samples outside the configured window are rejected. CPU and memory are percentages (0–100), error rate is a fraction (0–1), cost is an estimated hourly rate supplied by the collector, not a cloud bill. Use `scripts/ingest_metrics.py samples.json --environment ID` with `CLOUDMIND_TOKEN` in the process environment. Never commit tokens or sensitive logs.

| Endpoint | Purpose |
| --- | --- |
| GET `/operations/environments` | Visible environments and simulation flags |
| GET `/operations/{id}/metrics?hours=6` | Series and summary; 1–24 hours |
| GET `/operations/{id}/metrics.csv` | Authenticated CSV export |
| POST / DELETE `/operations/{id}/simulation` | Start / stop synthetic traffic |
| POST `/operations/{id}/simulation/incident` | Inject a synthetic ten-minute degradation |
| GET `/operations/{id}/forecast?minutes=30` | 5–60 minute forecast; needs 60 minutes of recent data |
| GET `/operations/{id}/anomalies` | Current robust-threshold findings |
| GET / PUT `/operations/{id}/policy` | Scaling limits, cooldown and execution mode |
| POST `/operations/{id}/scaling/plan` | Persist a fresh capacity recommendation |
| POST `/operations/{id}/scaling/{decision}/apply` | Apply once to simulation only |
| POST `/operations/{id}/scaling/{decision}/record` | ADMIN/DEVOPS operator receipt for a Kubernetes change |
| POST `/operations/{id}/evidence` | Submit a log/trace evidence item |
| POST `/operations/{id}/investigate` | Question, `use_llm` boolean; persist investigation |
| GET `/operations/{id}/events` | Latest environment events |
| GET `/audit-logs` | Administrator global operation log |
| GET `/metrics` | Prometheus exposition; separate bearer scrape token required |

Evidence example: `{"kind":"log","message":"checkout upstream timed out","severity":"error","service":"checkout","trace_id":"abc123"}`. Submit sanitized evidence only. Recent evidence is included in the optional LLM request. Messages are evidence, not executable instructions.

Forecast validation uses a chronological final-20% one-step holdout. The model is refit on the full history before recursive prediction. MAE/RMSE/MAPE compare forecasts with measured request rate; MAPE uses a denominator floor of 1 request/second. The plotted band widens with horizon using held-out residuals and is explicitly **not calibrated**.

## Advanced ML and SSO

- GET /operations/{id}/models: list model metadata owned by this environment.
- POST /operations/{id}/models/train: `{ "algorithm": "xgboost", "epochs": 30 }`; algorithms: xgboost, lstm, transformer, qlearning. Returns 201 after training. Neural epochs 1-100; at least 90 minutes of telemetry required.
- GET /operations/{id}/forecast?algorithm=lstm: use the latest trained artifact; ridge remains the default.
- PUT /operations/{id}/policy additionally accepts forecast_model, strategy (forecast/qlearning), max_spot_fraction (0-0.8), spot_cost_per_replica_hour.
- GET /auth/oidc/config: enabled flag; GET /auth/oidc/login starts PKCE login; callback redirects with a single-use code; POST /auth/oidc/exchange consumes it and issues tokens.
