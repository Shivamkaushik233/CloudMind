# CloudMind Console (Frontend) — Phase 8 stub

Planned stack: Next.js + TypeScript + Tailwind + Recharts + WebSockets.

Not built yet. This will become the dashboard that shows:
- Live CPU / memory / requests / cost tiles
- Traffic prediction chart (actual vs. AI-forecasted)
- Kubernetes pod/cluster status
- AI agent chat panel for root-cause investigations

Will consume `backend/core-api` (REST) and a future WebSocket stream from
`ml/forecasting` for live predictions.
