# Eight-phase source traceability

| Phase | Delivered source | Verification boundary |
|---|---|---|
| 1. Foundation | Next.js UI, FastAPI API, configuration, repository structure | Frontend production build and Python tests |
| 2. Management/data | Resource CRUD, ownership/RBAC, sessions, OIDC, PostgreSQL/SQLite, Redis limiter, Alembic | API/security tests; SQLite migration; external OIDC and PostgreSQL runtime require deployment tests |
| 3. Containers/Kubernetes | Docker Compose, Helm, persistent model volume, RBAC, explicit operator | Helm lint/render; Docker unavailable on development host |
| 4. Observability/streaming | Prometheus collector, Grafana, OTel, Kafka/MSK outbox, Spark lake, AWS sinks | Collector/archive mocks; live Kafka/Spark/AWS acceptance pending |
| 5. ML | Ridge, XGBoost, LSTM, Transformer, Q-learning; safe model serialization; SageMaker training image/launcher | Actual local training/prediction tests; cloud training not launched |
| 6. Scaling | Forecast safeguards, Q-learning proposal, cooldown, max-step, health guards, cost mix, continuous controller | Deterministic tests and mocked kubectl; real cluster acceptance pending |
| 7. Investigation | Evidence rules, Bedrock/Anthropic, logs/traces, Kubernetes and read-only database evidence collector | Local evidence workflow tests; external LLM calls require credentials |
| 8. AWS delivery | VPC/EKS/ECR/RDS/Redis/S3/DynamoDB, optional MSK/OpenSearch/SageMaker, API Gateway/CloudFront/Route53/WAF, Helm/ArgoCD | Terraform validation; no cloud apply or production readiness claim |

## Operational boundaries

The consolidated API is an intentional implementation choice preserved from the project brief. A separate control-plane service split is not necessary for running the supplied application. RL is experimental and cannot bypass forecast safety bounds. Forecast residual bands are heuristic. Cost values are configured estimates, not billing data. Real workloads require real telemetry; the demo is labelled synthetic.

The two-pool operator grows and waits before reducing capacity, but Kubernetes writes across two Deployments are not atomic. A partial failure stops the operator and requires reconciliation. Run one controller per environment and disable competing HPA writes. When an access token expires, the operator stops; supply a fresh token before restarting. Provisioning additional EKS nodes and configuring workload-specific readiness/SLOs remain deployment responsibilities.

The LLM produces hypotheses and recommendations. It never executes generated shell commands. Real remediation is through the bounded, explicit scaling operator.
