"""Generate local configuration without printing secrets or overwriting existing config."""
from pathlib import Path
import secrets

root = Path(__file__).resolve().parents[1]
target = root/'.env'
if target.exists():
    raise SystemExit('.env already exists; edit it manually. Nothing was overwritten.')
scrape = secrets.token_hex(32)
target.write_text('\n'.join([
    'POSTGRES_PASSWORD='+secrets.token_hex(24),
    'JWT_SECRET_KEY='+secrets.token_hex(32),
    'METRICS_SCRAPE_TOKEN='+scrape,
    'GRAFANA_PASSWORD='+secrets.token_hex(16),
    'CORS_ORIGINS=http://localhost:3000',
    'NEXT_PUBLIC_API_URL=http://localhost:8000',
    'DEMO_ENABLED=true',
    'ANTHROPIC_API_KEY=',
    'ANTHROPIC_MODEL=claude-sonnet-4-5',
])+'\n')
(root/'.secrets').mkdir(exist_ok=True)
(root/'.secrets/scrape-token').write_text(scrape)
print('Created .env and .secrets/scrape-token. Both must remain private.')
