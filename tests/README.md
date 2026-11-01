# Verification

Run `python -m pytest -q` at the repository root. API tests exercise authentication, refresh replay, logout revocation, ownership, viewer restrictions, ingestion validation, forecasting, incident investigation, scaling policy and single-use simulation decisions. Algorithm tests cover valid forecast bounds, gaps, synthetic degradation and cooldown. Kubernetes adapter tests use a fake command runner to verify dry-run and replica preconditions; they do not claim real cluster validation.

CI additionally builds the frontend and starts the default PostgreSQL Compose stack. See `docs/VALIDATION.md` for the validation actually performed for this release.
