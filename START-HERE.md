# CloudMind source package

Read README.md for setup and docs/VALIDATION.md for completed checks and remaining deployment tests.

Quick start with Docker Desktop/Engine and Compose v2:

```sh
python scripts/configure.py
docker compose up --build -d --wait
```

Open http://localhost:3000. Register, open Operations, and create a demo workspace. Demo telemetry is explicitly simulated. Native Python/Node setup is also documented in README.md.

This archive includes source, dependency lock files, tests, infrastructure configuration and documentation. Dependencies are installed during setup; private credentials, databases and installed packages are intentionally excluded. AWS provisioning, GitHub upload and live hosting have not been completed.
