# API boundary

The current application exposes one modular FastAPI API with centralized authentication and ownership enforcement. The console uses `NEXT_PUBLIC_API_URL`. No separate gateway process is needed locally. Put an HTTPS ingress/reverse proxy with production rate limits in front of the API during live deployment.
