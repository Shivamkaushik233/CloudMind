# Cross-service / integration tests

Per-service unit tests live inside each service (e.g.
`backend/core-api/tests`). This top-level folder is for integration and
load tests that span multiple services once there's more than one
running service to test together (k6, Playwright, Testcontainers).
