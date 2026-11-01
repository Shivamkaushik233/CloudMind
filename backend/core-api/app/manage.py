"""Operator commands. Run from backend/core-api: python -m app.manage --help."""
import argparse
import getpass
from datetime import datetime, timedelta
from app.database import Base, engine, SessionLocal
from app.models import User, Role
from app import operations_models
from app.operations_models import Metric, AuthSession
from app.auth import hash_password
from app.config import settings
from app.schemas import UserCreate


def main():
    parser = argparse.ArgumentParser(description="CloudMind database and administrator management")
    sub = parser.add_subparsers(dest="command", required=True)
    admin = sub.add_parser("create-admin")
    admin.add_argument("--email", required=True)
    admin.add_argument("--name", default="CloudMind Administrator")
    sub.add_parser("init-db")
    sub.add_parser("prune")
    args = parser.parse_args()
    from alembic import command
    from alembic.config import Config
    from pathlib import Path
    if settings.environment == "production":
        command.upgrade(Config(str(Path(__file__).resolve().parents[1]/"alembic.ini")), "head")
    else:
        Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if args.command == "create-admin":
            if db.query(User).filter_by(email=args.email).first():
                parser.error("Account already exists; this command never silently elevates existing users")
            password = getpass.getpass("Administrator password (8–72 UTF-8 bytes): ")
            if password != getpass.getpass("Confirm password: "):
                parser.error("Passwords do not match")
            data = UserCreate(email=args.email, full_name=args.name, password=password)
            db.add(User(email=data.email, full_name=data.full_name, hashed_password=hash_password(data.password), role=Role.ADMIN))
            db.commit()
            print("Administrator created.")
        elif args.command == "prune":
            count = db.query(Metric).filter(Metric.timestamp < datetime.utcnow()-timedelta(days=settings.retention_days)).delete()
            db.query(AuthSession).filter(AuthSession.expires_at < datetime.utcnow()).delete()
            db.commit()
            print(f"Pruned {count} old metric samples and expired sessions.")
        else:
            print("Database initialized. Existing data retained.")


if __name__ == "__main__":
    main()
