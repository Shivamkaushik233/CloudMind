# CloudMind — Original Project Brief

> Saved here verbatim from the planning conversation, as the reference
> document for the full 8-phase vision. Individual folder READMEs
> throughout this repo point back to the relevant section of this brief.

## One-line resume description

Built a cloud-native AI infrastructure platform that monitors distributed
applications, predicts workload demand using ML, detects anomalies,
performs intelligent autoscaling on Kubernetes, and uses LLM agents for
automated root-cause analysis and remediation.

## What CloudMind does

Continuously monitors CPU, memory, network, request rate, latency, error
rate, database performance, pod health, and traffic patterns for deployed
applications. Predicts near-term traffic changes and scales *before*
demand arrives rather than reacting to a CPU threshold. Detects abnormal
service behavior (e.g. latency spikes) and runs an AI investigation across
metrics → logs → traces → Kubernetes → database → recent deployments to
produce a root-cause hypothesis with a confidence score and a concrete
recommendation.

## The 6 major systems

1. **Cloud Management System** — users, projects, applications,
   deployments, environments, clusters. (Java/Spring Boot in the original
   plan → Python/FastAPI in this build; PostgreSQL, Redis, JWT/OAuth2.)
2. **Observability System** — Prometheus, Grafana, OpenTelemetry,
   CloudWatch.
3. **Event Streaming System** — Kafka topics: metrics.raw,
   metrics.processed, logs, traces, deployments, scaling.decisions,
   incidents, ai.actions.
4. **ML Prediction Engine** — traffic forecasting (XGBoost → LSTM →
   Transformer → RL for the scaling policy itself) and anomaly detection.
5. **Intelligent Autoscaler** — combines current + historical workload,
   ML prediction, latency/CPU/memory trend, and cost into a scaling
   decision, instead of a flat `IF CPU > 70%` rule. Cost-aware: chooses
   between strategies (e.g. more on-demand instances vs. fewer + spot)
   under an SLA constraint — minimize(infra cost + latency penalty +
   error penalty).
6. **AI Cloud Operations Agent** — natural-language "why is X slow"
   investigations over Prometheus/Grafana/K8s/logs/traces/deployment
   history/DB metrics, via an LLM (Amazon Bedrock in the AWS version).

## Technology stack (original plan)

- **Frontend:** Next.js, TypeScript, React, Tailwind, Recharts, WebSockets
- **Backend:** Java + Spring Boot (core services), Python + FastAPI (ML
  inference, anomaly detection, forecasting, AI agent)
- **Databases:** PostgreSQL (core data), Redis (cache/sessions/rate
  limiting), DynamoDB (high-volume operational state/scaling decisions),
  OpenSearch (logs), S3 (historical metrics, ML datasets, models, logs)
- **Streaming/ML infra:** Kafka/MSK, Spark, SageMaker
- **AWS:** CloudFront, Route 53, API Gateway, ALB, EKS, RDS, IAM,
  Secrets Manager, WAF, CloudWatch
- **DevOps:** Docker, Kubernetes, Helm, Terraform, GitHub Actions, ArgoCD
- **Security:** OAuth2, JWT, RBAC (ADMIN/DEVOPS/DEVELOPER/VIEWER), IAM,
  encryption, TLS, Secrets Manager, WAF, rate limiting, audit logs
- **Testing:** JUnit/Mockito/Testcontainers (Java), PyTest (Python),
  Jest/Playwright (frontend), k6 (load testing)

## Evaluation plan

- **Forecasting:** MAE, RMSE, MAPE
- **Anomaly detection:** Precision, Recall, F1
- **Autoscaling:** Kubernetes HPA vs. CloudMind AI Autoscaler, compared on
  average/peak latency, CPU utilization, number of scaling events,
  infrastructure cost, and SLA violations

## 8-phase roadmap

1. Foundation
2. Microservices + Database
3. Docker + Kubernetes
4. Monitoring + Kafka
5. ML Prediction Engine
6. Intelligent Autoscaling
7. AI Root-Cause Agent
8. AWS + Production Deployment

## Initial directory layout

```
cloudmind/
│
├── frontend/
│
├── backend/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── project-service/
│   └── deployment-service/
│
├── ml/
│   ├── forecasting/
│   ├── anomaly-detection/
│   └── models/
│
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   └── terraform/
│
├── ai-agent/
│
├── monitoring/
│
├── data-pipeline/
│
├── tests/
│
└── docs/
```

> Note: this build consolidates `auth-service`, `project-service`, and
> `deployment-service` into a single `backend/core-api` service for Phase
> 1, since they share the same data model and splitting them into three
> separately-deployed services before there's a reason to scale them
> independently would just add network hops for no benefit yet. Splitting
> them back out is straightforward once one of them actually needs to
> scale or deploy independently.
