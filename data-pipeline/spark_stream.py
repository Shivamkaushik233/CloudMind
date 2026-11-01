"""Spark Structured Streaming: durable event lake with checkpointed Kafka offsets.
Run with the matching spark-sql-kafka package and Hadoop S3A connector for S3.
"""
import argparse

def main():
    from pyspark.sql import SparkSession, functions as F, types as T
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--brokers",required=True)
    parser.add_argument("--output",required=True)
    parser.add_argument("--checkpoint",required=True)
    args=parser.parse_args()
    spark=SparkSession.builder.appName("cloudmind-events").getOrCreate()
    schema=T.StructType([T.StructField(k,T.StringType()) for k in ["id","kind","environment_id","created_at"]]+[T.StructField("data",T.StringType())])
    source=spark.readStream.format("kafka").option("kafka.bootstrap.servers",args.brokers).option("subscribe","cloudmind.events").option("startingOffsets","earliest").option("failOnDataLoss","true").load()
    events=source.select(F.from_json(F.col("value").cast("string"),schema).alias("event"),F.col("value").cast("string").alias("raw")).select("event.*","raw").withColumn("event_time",F.to_timestamp("created_at"))
    # Keep raw payloads for replay, including malformed records; Kafka offset checkpoints govern replay.
    query=events.writeStream.format("parquet").option("path",args.output).option("checkpointLocation",args.checkpoint).outputMode("append").trigger(processingTime="30 seconds").start()
    query.awaitTermination()
if __name__=="__main__":main()
