# Release validation - 1 November 2026

Recorded verification results:

- 39 automated tests passed from a freshly extracted source archive: ownership/RBAC, session rotation/revocation, telemetry validation, simulation workflow, forecasting, training and artifact round-trip for XGBoost/LSTM/Transformer, Q-learning, model isolation, one-time OIDC exchange, rate-limit CORS, mocked archival and collectors, scaling guards and two-pool execution order.
- Next.js production build and TypeScript check passed before the latest test/configuration additions. A clean-copy rebuild was attempted but no completed result was recorded.
- npm production dependency audit: zero reported vulnerabilities.
- Terraform 1.13.5 validate with locked AWS/random providers: valid configuration.
- Helm 3.19.0 lint, including worker configuration, plus chart rendering.
- Fresh SQLite Alembic upgrade and schema drift check (no differences).

One non-failing warning: Starlette deprecates the current httpx TestClient adapter. A future dependency refresh can migrate that test transport.

Not run on this host: Docker/Compose runtime (Docker unavailable), a real Kubernetes cluster, PostgreSQL migration runtime, Kafka/MSK/Spark runtime, AWS apply, external OIDC provider, Bedrock/Anthropic calls or SageMaker training. These require the separately planned deployment environment. CI includes a Compose integration job, but it has not been run on GitHub for this local source.

Unit and mocked integration tests do not certify production availability, model accuracy on real workloads, cloud permissions or costs. No cloud resources were provisioned and no public URL was published.

Browser acceptance: Playwright workflow source is included, but the local browser launch timed out before the workflow ran. This is not a passing browser test. Linux ML dependencies now explicitly use CPU wheels; resolution succeeded, but a Linux container build has not been executed here. GitHub write access still returns 403, so no upload is claimed.
