resource "aws_db_subnet_group" "main" {
  name_prefix = "${var.name}-"
  subnet_ids  = aws_subnet.private[*].id
}

resource "aws_db_instance" "main" {

  identifier                      = "${var.name}-postgres"
  engine                          = "postgres"
  engine_version                  = "17"
  instance_class                  = var.database_instance_class
  allocated_storage               = 20
  max_allocated_storage           = 100
  storage_encrypted               = true
  db_name                         = "cloudmind"
  username                        = "cloudmind"
  manage_master_user_password     = true
  multi_az                        = var.database_multi_az
  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.data.id]
  publicly_accessible             = false
  backup_retention_period         = 7
  deletion_protection             = var.deletion_protection
  skip_final_snapshot             = false
  final_snapshot_identifier       = "${var.name}-final"
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

}

resource "random_password" "redis" {

  length  = 40
  special = false

}

resource "aws_secretsmanager_secret" "redis" {
  name_prefix = "${var.name}/redis-"
}

resource "aws_secretsmanager_secret_version" "redis" {


  secret_id     = aws_secretsmanager_secret.redis.id
  secret_string = random_password.redis.result


}

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.name}-redis"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_replication_group" "main" {

  replication_group_id       = "${var.name}-redis"
  description                = "CloudMind rate limiting and shared state"
  engine                     = "redis"
  engine_version             = "7.1"
  node_type                  = var.redis_node_type
  num_cache_clusters         = 2
  automatic_failover_enabled = true
  multi_az_enabled           = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis.result
  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [aws_security_group.data.id]
  snapshot_retention_limit   = 7

}

resource "aws_s3_bucket" "archive" {
  bucket_prefix = "${var.name}-archive-"
}

resource "aws_s3_bucket_public_access_block" "archive" {


  bucket                  = aws_s3_bucket.archive.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true


}

resource "aws_s3_bucket_versioning" "archive" {
  bucket = aws_s3_bucket.archive.id
  versioning_configuration {
    status = "Enabled"
  }

}

resource "aws_s3_bucket_server_side_encryption_configuration" "archive" {

  bucket = aws_s3_bucket.archive.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }

  }


}

resource "aws_s3_bucket_lifecycle_configuration" "archive" {

  bucket = aws_s3_bucket.archive.id
  rule {
    id     = "archive-retention"
    status = "Enabled"
    filter {

    }

    expiration {
      days = 365
    }

  }


}

resource "aws_dynamodb_table" "events" {

  name         = "${var.name}-events"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {

    name = "id"
    type = "S"

  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }


}

resource "aws_msk_serverless_cluster" "main" {

  count        = var.enable_streaming ? 1 : 0
  cluster_name = "${var.name}-events"
  vpc_config {

    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.data.id]

  }

  client_authentication {
    sasl {
      iam {
        enabled = true
      }

    }

  }


}

resource "aws_opensearch_domain" "main" {

  count          = var.enable_search ? 1 : 0
  domain_name    = "${var.name}-logs"
  engine_version = "OpenSearch_2.19"
  cluster_config {
    instance_type          = "t3.small.search"
    instance_count         = 2
    zone_awareness_enabled = true
    zone_awareness_config {
      availability_zone_count = 2
    }

  }

  vpc_options {

    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.data.id]

  }

  ebs_options {

    ebs_enabled = true
    volume_size = 20
    volume_type = "gp3"

  }

  encrypt_at_rest {
    enabled = true
  }

  node_to_node_encryption {
    enabled = true
  }

  domain_endpoint_options {

    enforce_https       = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"

  }

  access_policies = jsonencode({
    Version = "2012-10-17", Statement = [{
      Effect = "Allow", Principal = {
        AWS     = aws_iam_role.application.arn
      }, Action = ["es:ESHttpPut", "es:ESHttpPost", "es:ESHttpGet"], Resource = "arn:${data.aws_partition.current.partition}:es:${var.region}:${local.account}:domain/${var.name}-logs/*"
      }
    ]
    }
  )

}

resource "aws_iam_role_policy" "application" {

  role = aws_iam_role.application.id
  policy = jsonencode({
    Version = "2012-10-17", Statement = concat([{
      Effect = "Allow", Action = ["s3:PutObject", "s3:GetObject"], Resource = "${aws_s3_bucket.archive.arn}/*"
      }, {
      Effect = "Allow", Action = ["s3:ListBucket"], Resource = aws_s3_bucket.archive.arn
      }, {
      Effect = "Allow", Action = ["dynamodb:PutItem", "dynamodb:GetItem"], Resource = aws_dynamodb_table.events.arn
      }

      ], length(var.bedrock_model_arns) > 0 ? [{
        Effect = "Allow", Action = ["bedrock:InvokeModel"], Resource = var.bedrock_model_arns
      }
      ] : [],
      var.enable_search ? [{
        Effect = "Allow", Action = ["es:ESHttpPut", "es:ESHttpPost", "es:ESHttpGet"], Resource = "${aws_opensearch_domain.main[0].arn}/*"
        }
      ] : [],
      var.enable_streaming ? [{
        Effect = "Allow", Action = ["kafka-cluster:Connect", "kafka-cluster:DescribeCluster", "kafka-cluster:DescribeTopic", "kafka-cluster:CreateTopic", "kafka-cluster:WriteData", "kafka-cluster:ReadData", "kafka-cluster:AlterGroup", "kafka-cluster:DescribeGroup"], Resource = [aws_msk_serverless_cluster.main[0].arn, replace(aws_msk_serverless_cluster.main[0].arn, ":cluster/", ":topic/"), "${replace(aws_msk_serverless_cluster.main[0].arn, ":cluster/", ":topic/")}/*", "${replace(aws_msk_serverless_cluster.main[0].arn, ":cluster/", ":group/")}/*"]
        }
    ] : [])
    }
  )

}

resource "aws_iam_role" "sagemaker" {

  count       = var.enable_sagemaker ? 1 : 0
  name_prefix = "${var.name}-training-"
  assume_role_policy = jsonencode({
    Version = "2012-10-17", Statement = [{
      Effect = "Allow", Principal = {
        Service = "sagemaker.amazonaws.com"
      }, Action = "sts:AssumeRole"
      }
    ]
    }
  )

}

resource "aws_iam_role_policy" "sagemaker" {

  count = var.enable_sagemaker ? 1 : 0
  role  = aws_iam_role.sagemaker[0].id
  policy = jsonencode({
    Version = "2012-10-17", Statement = [{
      Effect = "Allow", Action = ["s3:GetObject", "s3:PutObject"], Resource = "${aws_s3_bucket.archive.arn}/*"
      }, {
      Effect = "Allow", Action = ["s3:ListBucket"], Resource = aws_s3_bucket.archive.arn
      }, {
      Effect = "Allow", Action = ["ecr:GetAuthorizationToken", "ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer", "logs:CreateLogStream", "logs:PutLogEvents", "logs:CreateLogGroup"], Resource = "*"
      }
    ]
    }
  )

}

