# CloudMind

AI-powered cloud infrastructure & intelligent autoscaling platform — full
project vision in `docs/PROJECT_BRIEF.md`. This repo is being built out in
the 8 phases described there, starting from Phase 1.

## What's real right now vs. what's a stub

| Path | Status |
|---|---|
| `backend/core-api` | **Working.** Full FastAPI service: users, auth (JWT), projects, applications, environments, clusters, deployments. SQLite by default, swappable to Postgres. |
| everything else | **Stub.** Each folder has a README describing what it will become and which phase it belongs to. |

## Why Python instead of Java/Spring Boot for now

The original brief calls for Java + Spring Boot as the primary backend.
This scaffold uses **FastAPI (Python)** instead for the working service,
because the sandbox this was built in can reach PyPI but not Maven
Central, so a Spring Boot service couldn't fetch its dependencies here.
The API shape (REST resources, JWT auth, RBAC roles) is deliberately kept
framework-agnostic in its design so a Java re-implementation later is a
port, not a redesign, if you decide you want the Java version for
interview-story purposes.

## Repo layout

```
cloudmind/
├── frontend/                 # Next.js console — stub
├── backend/
│   ├── api-gateway/          # stub
│   └── core-api/             # WORKING — users/projects/apps/deployments
├── ml/
│   ├── forecasting/          # stub — XGBoost/LSTM/Transformer
│   ├── anomaly-detection/    # stub
│   └── models/               # trained artifacts land here
├── infrastructure/
│   ├── docker/                # stub
│   ├── kubernetes/            # stub
│   └── terraform/             # stub
├── ai-agent/                  # stub — LLM root-cause agent
├── monitoring/                 # stub — Prometheus/Grafana
├── data-pipeline/              # stub — Kafka-alike + data lake
├── tests/                      # cross-service tests, once >1 service exists
└── docs/
    └── PROJECT_BRIEF.md        # the original full architecture doc
```

## Quickstart (core-api)

```bash
cd backend/core-api
pip install -r requirements.txt
uvicorn app.main:app --reload
# → http://localhost:8000/docs for interactive Swagger UI
```

See `backend/core-api/README.md` for full details, sample requests, and
test instructions.

## Suggested next step

Phase 2 (per the roadmap) is fleshing out more of the Cloud Management
System and splitting it toward real microservices; Phase 4/5 (metrics +
ML) is where the "AI" part of CloudMind actually starts to come alive.
Pick whichever excites you more — they don't have to happen in strict
order for a portfolio project.
