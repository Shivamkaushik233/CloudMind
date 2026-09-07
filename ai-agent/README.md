# AI Cloud Operations Agent — Phase 7 stub

Will be a small FastAPI service that:
1. Accepts a natural-language question ("why is checkout slow?")
2. Pulls recent metrics/logs/traces + deployment history from core-api
3. Calls an LLM (Claude via the Anthropic API, or Bedrock in the AWS
   version) with that evidence to produce a root-cause hypothesis +
   confidence + recommendation, in the style shown in the project brief.

Depends on `ml/anomaly-detection` (to know *something* is wrong) and
`backend/core-api` (to fetch deployment history) existing first.
