# Event streaming & data lake — Phase 4/5 stub

Local dev plan: a lightweight in-process/Redis-backed pub-sub standing in
for Kafka (topics: metrics.raw, metrics.processed, scaling.decisions,
incidents), landing into local Parquet files standing in for the S3 data
lake, until we're ready to point this at real MSK + S3 + Spark.
