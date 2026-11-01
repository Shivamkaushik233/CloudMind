# Event pipeline

app/worker.py publishes the SQL outbox to cloudmind.events and categorized roadmap topics. Delivery is at least once; consumers must deduplicate by event id. Kafka uses local plaintext networking by default; set KAFKA_IAM=true for TLS/IAM MSK. Optional archive sinks write S3, DynamoDB and SigV4-signed OpenSearch. spark_stream.py checkpoints Kafka offsets into a Parquet event lake. Spark and matching Kafka/S3 connectors are separate runtime prerequisites, not bundled with the API.
