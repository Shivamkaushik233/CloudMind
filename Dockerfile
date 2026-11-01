# Stage 1: Build the Next.js Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

COPY frontend/ ./
ENV NEXT_EXPORT=1
RUN npm run build

# Stage 2: Python Core API Backend serving the Frontend
FROM python:3.12-slim
WORKDIR /app

COPY backend/core-api/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY backend/core-api/app ./app
COPY backend/core-api/migrations ./migrations
COPY backend/core-api/alembic.ini ./

# Copy built frontend static export
COPY --from=frontend-builder /app/frontend/out ./frontend/out

ENV PORT=8000
ENV DEMO_ENABLED=true
ENV CORS_ORIGINS=*
ENV JWT_SECRET_KEY=c10udm1nd-sup3r-s3cur3-pr0duct10n-k3y-99482716382910472819284710

EXPOSE 8000

CMD ["sh", "-c", "python -m alembic upgrade head; exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
