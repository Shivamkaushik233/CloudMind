# API Gateway — later phase stub

Placeholder for a routing/auth-checking layer in front of the individual
services (core-api, ml service, ai-agent). For now, the frontend / clients
talk to `backend/core-api` directly during local development.

Future: Kong / Spring Cloud Gateway / AWS API Gateway, JWT validation,
rate limiting, request routing to whichever service owns a given path.
