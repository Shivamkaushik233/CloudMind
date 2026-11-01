# Containers

Root `docker-compose.yml` starts persistent Postgres, the API and the frontend. The `streaming` profile adds Kafka and its event worker. `docker-compose.observability.yml` adds Prometheus and Grafana. Service Dockerfiles are in `backend/core-api` and `frontend`. See the root quickstart.
