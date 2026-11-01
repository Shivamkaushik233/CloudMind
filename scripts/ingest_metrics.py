"""Send a telemetry JSON batch to an owned environment. No synthetic fallback."""
import argparse
import json
import os
from pathlib import Path
import httpx


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", type=Path)
    parser.add_argument("--api", default="http://localhost:8000")
    parser.add_argument("--environment", required=True)
    args = parser.parse_args()
    token = os.environ.get("CLOUDMIND_TOKEN")
    if not token:
        parser.error("Set CLOUDMIND_TOKEN to your access token")
    data = json.loads(args.file.read_text())
    response = httpx.post(f"{args.api}/operations/{args.environment}/metrics", headers={"Authorization": "Bearer "+token}, json=data, timeout=30)
    response.raise_for_status()
    print(response.json())


if __name__ == "__main__":
    main()
