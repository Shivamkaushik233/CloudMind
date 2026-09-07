from fastapi import FastAPI

from app.database import Base, engine
from app.routers import auth, projects, applications, environments, clusters, deployments

# Dev-friendly: create tables on startup instead of requiring a migration
# tool for this stage. Swap for Alembic migrations once the schema needs
# to evolve under real data.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CloudMind Core API",
    description=(
        "Cloud Management System for CloudMind: users, projects, "
        "applications, environments, clusters, and deployments. "
        "Phase 1 of the CloudMind roadmap — see /docs/PROJECT_BRIEF.md."
    ),
    version="0.1.0",
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(applications.router)
app.include_router(environments.router)
app.include_router(clusters.router)
app.include_router(deployments.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "service": "core-api"}
