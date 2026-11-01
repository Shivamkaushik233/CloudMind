# CloudMind

A runnable cloud-operations platform: manage projects and environments, ingest telemetry, forecast traffic, detect anomalies, plan capacity, and investigate incidents from evidence.

The Next.js console and FastAPI backend run locally without cloud credentials. PostgreSQL, Kafka, Prometheus and Grafana have optional container configurations. Real Kubernetes execution is an explicit operator command. Optional Bedrock and Claude integrations augment the built-in evidence-based investigation engine.

## Start with Docker

Prerequisites: Docker Engine/Desktop with Compose v2 and Python 3.12+ for the configuration helper.

```bash
python scripts/configure.py
docker compose up --build -d --wait
```

Open **http://localhost:3000**. Register a developer account, choose **Operations → Create demo workspace**. The demo contains six hours of clearly labelled synthetic telemetry. Explore Monitor, Forecast, Autoscaler, Investigation and Activity. Inject an incident to see anomalies and run an investigation. In Autoscaler, save **Apply to simulation** mode, generate a plan and apply it.

API documentation: **http://localhost:8000/docs**. API health checks include database connectivity.

Create an administrator without exposing a public registration backdoor:

```bash
docker compose exec api python -m app.manage create-admin --email you@example.com
```

The command prompts for a password. Administrators can manage roles in User Management. Developer accounts own their projects; viewers are read-only. There are no built-in administrator credentials.

## Run without Docker

Use Python 3.12 and Node.js 22. From the repository root:

```bash
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r backend/core-api/requirements-ml.txt
```

In a backend terminal:

```bash
cd backend/core-api
# Copy .env.example to .env, then set JWT_SECRET_KEY to a random secret.
# Set DEMO_ENABLED=true to enable demo workspace creation.
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

The frontend defaults to http://localhost:8000. Set `NEXT_PUBLIC_API_URL` **before building** to change it. SQLite is the local backend default; Compose uses persistent PostgreSQL. Admin creation works with `python -m app.manage create-admin --email you@example.com` from the backend directory.

## What is implemented

| Area | Working implementation |
| --- | --- |
| Resource management | Users, roles, owned projects, applications, environments, cluster registry and deployment records |
| Authentication | Password login, optional OIDC/PKCE SSO, rotating sessions, logout revocation, Redis rate limits |
| Observability | Validated metric batches, per-environment history, live charts, CSV export, protected Prometheus scrape, Grafana dashboard |
| Forecasting | Ridge, trained XGBoost/LSTM/Transformer models, chronological holdout metrics, safe JSON/NPZ model artifacts |
| Anomaly detection | Robust recent-baseline thresholds, load-driven/degradation labels, synthetic incident injection |
| Scaling | Forecast or guarded Q-learning strategy, bounds/cooldown/freshness safeguards, cost-aware pool allocation, simulation apply |
| Kubernetes | Explicit context/namespace/deployment operator CLI, server-side dry-run by default, replica preconditions and audit receipt |
| Investigation | Metrics, logs/traces, deployment history, operator-collected Kubernetes/database evidence; local rules or Bedrock/Claude |
| Event pipeline | SQL outbox, Kafka/MSK IAM, categorized topics, Spark event lake, S3/DynamoDB/OpenSearch sinks |
| Delivery | Docker/Compose, Alembic migrations, Helm, AWS Terraform, ArgoCD configuration, CI checks and reproducible ZIP |

## Real telemetry and integrations

See [API guide](docs/API.md), [operations runbook](docs/OPERATIONS.md), [architecture](docs/ARCHITECTURE.md), and [validation record](docs/VALIDATION.md).

Metrics are never invented for real environments. Submit actual samples to `POST /operations/{environment_id}/metrics`. Simulated and ingested data cannot be mixed in an active simulation. A stopped simulation retains its history but real metrics are queried separately.

Enable the optional Kafka profile:

```bash
docker compose --profile streaming up --build -d --wait
```

Enable local Prometheus and Grafana after running the configuration helper:

```bash
docker compose -f docker-compose.yml -f docker-compose.observability.yml up --build -d --wait
```

Prometheus: http://localhost:9090. Grafana: http://localhost:3001 (user `admin`, password from your private `.env`). The pre-provisioned dashboard shows CPU, memory, latency, traffic, error rate and replicas. These service ports bind only to loopback.

For optional LLM analysis, set `ANTHROPIC_API_KEY` and an available `ANTHROPIC_MODEL`. Select the Claude checkbox explicitly in Investigation. This sends the question and collected environment evidence to Anthropic; local investigations require no key. Provider calls can incur charges. No LLM call executes remediation.

## Tests and packaging

```bash
python -m pytest -q
python scripts/evaluate.py --output evaluation.json
cd frontend
npm ci
npm run build
npm audit --omit=dev
cd ..
python scripts/package_release.py
```

The ZIP and checksum are placed in `releases/`. Dependencies, databases, credentials, caches and previous ZIPs are excluded. CI tests the API, builds the frontend and brings up the PostgreSQL Compose stack.

## Source release and deployment status

This source release includes implementations across the original eight phases. See [roadmap traceability](docs/ROADMAP.md), [AWS setup](infrastructure/terraform/README.md), and [validation](docs/VALIDATION.md) for exact boundaries. AWS resources and a public URL have **not** been deployed. External integrations need account-specific configuration and acceptance testing during the separately requested live-deployment phase.

The API is modular FastAPI rather than six separately deployed services. Deployment records track releases; they do not build arbitrary user repositories. Model scores are measured holdout results, not promises of production accuracy. Cluster credentials remain with the operator. Spot execution requires two explicitly mapped deployments on matching node groups; it does not create nodes by itself.

In **Forecast**, select XGBoost/LSTM/Transformer and click **Train selected model** after collecting 90 minutes of telemetry. In **Autoscaler**, train Q-learning before selecting that strategy. Neural training is CPU-based. Docker includes advanced ML by default; use build argument `ENABLE_ML=false` for a smaller core-only image.

Local native development uses SQLite bootstrap. Production uses versioned migrations at startup and persistent PostgreSQL. Do not point initial migrations at an existing unmanaged database: back it up and migrate into a fresh managed database first.
