FROM python:3.12-slim

WORKDIR /app

COPY backend/core-api/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY backend/core-api/app ./app
COPY backend/core-api/migrations ./migrations
COPY backend/core-api/alembic.ini ./

ENV PORT=8000
ENV DEMO_ENABLED=true
ENV CORS_ORIGINS=*
ENV JWT_SECRET_KEY=c10udm1nd-sup3r-s3cur3-pr0duct10n-k3y-99482716382910472819284710

EXPOSE 8000

CMD ["sh", "-c", "python -m alembic upgrade head; exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
