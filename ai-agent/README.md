# Incident investigation

The operations investigation endpoint correlates telemetry, anomalies, deployment history and submitted evidence. scripts/collect_evidence.py reads bounded Kubernetes status and optional read-only PostgreSQL statistics. Configure BEDROCK_MODEL_ID or ANTHROPIC_API_KEY for optional external analysis. Local rules need no provider credentials. Evidence is untrusted data; model output never executes commands.
