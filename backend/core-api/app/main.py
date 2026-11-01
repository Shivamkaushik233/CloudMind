from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.config import settings
from app import operations_models
from app.routers import operations
from app.routers import ml
from app.routers import oidc
from app.security import RateLimitMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.routers import (
    auth,
    projects,
    applications,
    environments,
    clusters,
    deployments,
)

# Development bootstrap only. Production startup runs the versioned Alembic migrations.
if settings.environment != "production":
    Base.metadata.create_all(bind=engine)

if settings.environment == "production" and (settings.jwt_secret_key.startswith(("dev-secret", "replace-", "change-")) or len(settings.jwt_secret_key) < 32):
    raise RuntimeError("Production requires a strong JWT_SECRET_KEY of at least 32 characters")

app = FastAPI(
    title="CloudMind Core API",
    description=(
        "Cloud Management System for CloudMind: users, projects, "
        "applications, environments, clusters, and deployments. "
        "Telemetry, forecasting, anomaly detection, scaling and evidence-based investigations."
    ),
    version="1.0.0",
)

@app.get("/", tags=["meta"])
def root():
    return {
        "service": "CloudMind",
        "status": "running",
        "message": "CloudMind Core API is live",
        "docs": "/docs",
        "health": "/health",
    }


app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(applications.router)
app.include_router(environments.router)
app.include_router(clusters.router)
app.include_router(deployments.router)
app.include_router(operations.router)
app.include_router(ml.router)
app.include_router(oidc.router)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(SessionMiddleware,secret_key=settings.jwt_secret_key,https_only=settings.environment=="production",same_site="lax")


# Allow the deployed CloudMind frontend to communicate with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




@app.get("/health", tags=["meta"])
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        raise HTTPException(503, "Database unavailable")
    return {"status": "ok", "service": "core-api"}

if settings.otel_endpoint:
    from opentelemetry import trace
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    provider=TracerProvider(resource=Resource.create({"service.name":"cloudmind-api"}))
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=settings.otel_endpoint)))
    trace.set_tracer_provider(provider)
    FastAPIInstrumentor.instrument_app(app,tracer_provider=provider,excluded_urls="health,metrics")
