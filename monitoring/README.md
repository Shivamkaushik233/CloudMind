# Monitoring

The metrics API and simulator live in `backend/core-api/app/routers/operations.py` and `app/telemetry.py`. Protected `/metrics` supports Prometheus; the configuration and provisioned Grafana dashboard are in this directory. Run the optional observability Compose overlay as documented in the root README.

The console queries authenticated history and summaries directly. Collector-submitted costs are estimates; they are not cloud billing data. Native OpenTelemetry exporters are not automatically installed into external applications; submit sanitized log/trace evidence through the API or connect collectors in the deployment phase.
