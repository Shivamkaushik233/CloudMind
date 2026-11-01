# Operations runbook

## Configuration

Use `scripts/configure.py` for Compose or `backend/core-api/.env.example` for native local execution. Do not commit `.env`, `.secrets`, database files, access tokens or API keys. Production mode rejects the default and placeholder signing keys. CORS uses an explicit comma-separated origin allowlist.

`NEXT_PUBLIC_API_URL` is a frontend build argument. A hosted frontend must use the API's public HTTPS URL; a Docker service name is not reachable from a user's browser. Changing the build argument requires rebuilding the frontend.

## Database and backups

Compose persists PostgreSQL in a named volume. `docker compose down` keeps it; `down -v` deletes it. Back up before upgrades:

```bash
docker compose exec -T database pg_dump -U cloudmind cloudmind > cloudmind-backup.sql
```

Protect backup files as private data. Restore into a separate empty database and validate before switching an environment. Metrics retention defaults to 30 days. Run `python -m app.manage prune` from the backend directory regularly, or enable the Kafka worker, which prunes hourly. Investigations and audit events are retained until their environment is removed.

## Kubernetes operator

Build/load or publish the two images and edit image references in `infrastructure/kubernetes/cloudmind.yml`. Create the `cloudmind-api-config` secret in namespace `cloudmind` with `DATABASE_URL` (external Postgres), `JWT_SECRET_KEY`, `CORS_ORIGINS`, and optional integration settings. Never put real secret literals in a committed manifest. Apply the manifest only after reviewing its context and namespace. It creates no public ingress; use port-forward for initial testing.

For workload scaling, configure a DEVOPS/ADMIN account, collect actual telemetry and save policy mode `kubernetes`. The operator must explicitly map the CloudMind environment to the correct kubeconfig context, namespace and Deployment:

```bash
python scripts/kubernetes_scale.py --environment ENV_ID --context CONTEXT --namespace NAMESPACE --deployment DEPLOYMENT
```

This performs a server-side **dry-run** by default. Add `--apply` only to execute the reviewed change. The command checks current replicas and passes a replica precondition to Kubernetes. It sends an operator-reported audit receipt after success. If audit recording fails after scaling, reconcile it manually; do not repeat the scale blindly. Receipts are not independent cluster verification. Use one operator per environment and do not run Kubernetes HPA and this operator against the same workload simultaneously.

`scaler-role.yml` provides a least-privilege Role example scoped to one Deployment. Bind it to an existing operator identity. Credentials stay in kubeconfig; CloudMind does not store kubeconfig or accept arbitrary shell commands from the browser.

## Event streaming and observability

The optional Kafka profile starts a single local broker and the outbox worker. It is suitable for local integration, not a production replicated broker cluster. Topic `cloudmind.events` carries event metadata/payloads. IDs are stable deduplication keys. Start consumers with an explicit consumer group and commit offsets after successful processing.

Prometheus uses a separate scrape credential. Grafana has a provisioned data source and dashboard. If the target is down, check the API health, matching scrape token and Docker network. Simulator data advances when requested by the console, not merely by Prometheus scraping.

## Live deployment next

No cloud resources, live domains or paid services are created by this source package. Choose the hosting target first; then configure persistent Postgres, private service networking, secrets, HTTPS, backups, health checks and budget/alerts. Validate real telemetry, Kubernetes credentials and the LLM provider separately. Apply production rate limits at the ingress, configure centralized logs and review session storage against the deployment's threat model. Browser tokens currently use localStorage, so an XSS compromise can expose them.

The historical `render.yaml` remains unchanged for compatibility with the existing repository, but it is not the deployment specification for this version. Review and replace it during the deployment phase rather than relying on its old ephemeral-storage setup. Keep this work on a separate branch until any existing automatic deployment is ready for the new application.

## Added release integrations

Use the Helm chart and Terraform runbook for the current full deployment. The API image runs migrations before startup. Fresh installations require an empty database; back up and migrate legacy unmanaged databases separately. Do not stamp unknown schemas merely to bypass migration failures.

OIDC: set OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, PUBLIC_API_URL and FRONTEND_URL. Register `/auth/oidc/callback` at the provider. Only verified email identities are accepted. Existing password accounts are not silently linked by email. Callback exchange codes are short-lived and single use.

Advanced models: install requirements-ml.txt, persist MODEL_STORE, and train from Forecast. A core-only image returns a clear unavailable response for missing ML dependencies. Model retraining is explicit and CPU-bound. Back up artifacts with the database.

Real Prometheus collection: scripts/collect_prometheus.py takes a JSON map of seven keys (cpu, memory, rps, latency_ms, error_rate, replicas, cost_per_hour) to workload-specific PromQL expressions. Every expression must return one fresh finite scalar vector value. Schedule it once per minute with an operator token; missing measurements fail rather than inventing data.

Continuous scaling: scripts/controller.py accepts the same environment/context/namespace/deployment mapping as the single-run operator. It stops on errors or expired authorization. Set --spot-deployment for two node-selector-pinned pools. Use --apply only after reviewing dry-run behavior. Ensure node capacity exists; this operator scales pods, not EKS nodes.

Set OTEL_ENDPOINT to your OTLP HTTP traces endpoint, e.g. `http://collector:4318/v1/traces`. The API exports request spans. Set ARCHIVE_BUCKET, DYNAMODB_EVENTS_TABLE and/or OPENSEARCH_URL to enable worker sinks. AWS authentication uses the standard SDK credential chain/IRSA. Failed sink delivery leaves the outbox pending for retry; IDs are stable, so downstream consumers must deduplicate.

Bedrock takes precedence over Anthropic when BEDROCK_MODEL_ID is set. External analysis is invoked only when the user selects it. No provider request was made during local verification.
