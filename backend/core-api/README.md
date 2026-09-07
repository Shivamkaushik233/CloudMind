# core-api — CloudMind Cloud Management System

This is the one **working** service in the current CloudMind scaffold. It
covers Phase 1 of the roadmap: users, projects, applications,
environments, clusters, and deployments, with JWT auth and role-based
access control.

It consolidates what the original brief called `auth-service`,
`project-service`, and `deployment-service` into one FastAPI app, since
splitting them into independently-deployed services before any of them
needs to scale on its own just adds network hops for no benefit yet.

## Data model

```
User ──owns──> Project ──has──> Application ──has──> Environment ──has──> Deployment
                                                          │
                                                          └── belongs to a Cluster
```

Roles: `ADMIN`, `DEVOPS`, `DEVELOPER`, `VIEWER`. Only `ADMIN`/`DEVOPS` can
create or delete clusters. Projects (and everything under them) are only
visible to their owner — that's the multi-tenancy story for now.

## Run it

```bash
pip install -r requirements.txt
cp .env.example .env   # optional — defaults already work
uvicorn app.main:app --reload
```

Then open **http://localhost:8000/docs** for interactive Swagger UI, or
use the sample flow below.

## Run with Docker

```bash
docker build -t cloudmind-core-api .
docker run -p 8000:8000 cloudmind-core-api
```

## Run the tests

```bash
pytest tests/ -v
```

7 tests cover: registration, login (including wrong-password rejection),
duplicate-email rejection, the full project → application → environment
→ deployment flow, cross-user project isolation, and the cluster-creation
RBAC rule. All pass against an isolated in-memory SQLite database per
test run.

## Sample request flow

```bash
BASE=http://localhost:8000

# Register + log in
curl -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"email":"admin@cloudmind.io","full_name":"Admin","password":"secret123","role":"ADMIN"}'

TOKEN=$(curl -s -X POST $BASE/auth/login \
  -d "username=admin@cloudmind.io&password=secret123" | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# Create a cluster (admin/devops only)
curl -X POST $BASE/clusters -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"prod-eks","provider":"aws","region":"us-east-1"}'

# Create a project → application → environment → deployment
PROJECT_ID=$(curl -s -X POST $BASE/projects -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"CloudMind"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")

APP_ID=$(curl -s -X POST $BASE/projects/$PROJECT_ID/applications -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"checkout-service"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")

ENV_ID=$(curl -s -X POST $BASE/applications/$APP_ID/environments -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"production"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")

curl -X POST $BASE/environments/$ENV_ID/deployments -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"version":"v1.8.2"}'
```

## Moving to Postgres

Change `DATABASE_URL` in `.env` to a Postgres DSN
(`postgresql+psycopg2://user:pass@host:5432/dbname`), add `psycopg2-binary`
to `requirements.txt`, and everything else is unchanged — the models and
routers don't know or care which database engine is underneath.

## What's deliberately not here yet

- Alembic migrations (tables are just created on startup for now)
- Refresh tokens / token revocation
- Rate limiting, audit logs (Phase 8 security hardening)
- The `api-gateway` sitting in front of this (currently the frontend
  would call this service directly)
