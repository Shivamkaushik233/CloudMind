"""Transactional outbox publisher. Kafka delivery is at least once; deduplicate by id."""
import json
import logging
import signal
import time
from datetime import datetime, timedelta
from kafka import KafkaProducer
from app.database import SessionLocal
from app.operations_models import Event, Metric, AuthSession
from app.config import settings

logging.basicConfig(level=logging.INFO)
running = True


def stop(*_):
    global running
    running = False


def event_topic(kind):
    if kind=="metrics.ingested":return "metrics.raw"
    if kind=="evidence.log":return "logs"
    if kind=="evidence.trace":return "traces"
    if kind.startswith("deployment"):return "deployments"
    if kind.startswith("scaling"):return "scaling.decisions"
    if kind.startswith("incident"):return "incidents"
    if kind.startswith("model"):return "metrics.processed"
    return "ai.actions"


def kafka_options():
    if not settings.kafka_iam:return {}
    from kafka.sasl.oauth import AbstractTokenProvider
    from aws_msk_iam_sasl_signer import MSKAuthTokenProvider
    class TokenProvider(AbstractTokenProvider):
        def token(self):
            token,_=MSKAuthTokenProvider.generate_auth_token(settings.aws_region)
            return token
    return {"security_protocol":"SASL_SSL","sasl_mechanism":"OAUTHBEARER","sasl_oauth_token_provider":TokenProvider()}


def publish_batch(db, producer, sink=None):
    records = db.query(Event).filter_by(published=0).order_by(Event.created_at).limit(100).all()
    for record in records:
        payload={"id":record.id,"kind":record.kind,"environment_id":record.environment_id,"created_at":record.created_at.isoformat()+"Z","data":record.data}
        if producer:
            producer.send("cloudmind.events",key=record.id.encode(),value=payload).get(timeout=10)
            producer.send(event_topic(record.kind),key=record.id.encode(),value=payload).get(timeout=10)
        if sink:
            sink.publish(payload)
        record.published = 1
        db.commit()
    return len(records)


def main():
    if not any([settings.kafka_bootstrap_servers,settings.archive_bucket,settings.dynamodb_events_table,settings.opensearch_url]):
        raise SystemExit("Configure Kafka or an AWS archive sink for the event worker")
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    producer = KafkaProducer(bootstrap_servers=settings.kafka_bootstrap_servers.split(","), value_serializer=lambda v: json.dumps(v).encode(), acks="all", retries=5, **kafka_options()) if settings.kafka_bootstrap_servers else None
    from app.cloud import ArchiveSink
    sink=ArchiveSink() if any([settings.archive_bucket,settings.dynamodb_events_table,settings.opensearch_url]) else None
    last_prune = 0
    try:
        while running:
            with SessionLocal() as db:
                try:
                    publish_batch(db, producer, sink)
                    if time.monotonic()-last_prune > 3600:
                        db.query(Metric).filter(Metric.timestamp < datetime.utcnow()-timedelta(days=settings.retention_days)).delete()
                        db.query(AuthSession).filter(AuthSession.expires_at < datetime.utcnow()).delete()
                        db.commit()
                        last_prune = time.monotonic()
                except Exception:
                    db.rollback()
                    logging.exception("Outbox retry; unpublished events remain persisted")
            time.sleep(2)
    finally:
        if producer:
            producer.flush(timeout=10)
            producer.close(timeout=10)


if __name__ == "__main__":
    main()
