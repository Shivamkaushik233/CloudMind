# CloudMind API

Python 3.12 FastAPI/SQLAlchemy API with SQLite locally or PostgreSQL via psycopg. Install `requirements.txt`, copy `.env.example` to `.env`, set a secret, then run `uvicorn app.main:app --port 8000`. Swagger UI is at `/docs`.

See the root README for complete setup and `docs/API.md` for telemetry and operations endpoints. `app/manage.py` bootstraps administrators and prunes retained metrics. `app/worker.py` publishes the transactional outbox to Kafka when enabled. `app/intelligence.py` contains forecasting, anomaly detection and capacity planning. `app/routers/operations.py` enforces ownership and integrates those capabilities.

Tests run from the repository root: `python -m pytest -q`. Settings are environment-driven. The shipped default signing key is development-only and is rejected in production mode. Database startup creates missing tables; it does not perform arbitrary schema migrations.
