#!/bin/sh
set -eu
python -m alembic upgrade head || true
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
