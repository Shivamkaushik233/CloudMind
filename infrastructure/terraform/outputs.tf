output "cluster_name" { value = aws_eks_cluster.main.name }
output "region" { value = var.region }
output "vpc_id" { value = aws_vpc.main.id }
output "ecr_repositories" { value = { for k, v in aws_ecr_repository.application : k => v.repository_url } }
output "database_host" { value = aws_db_instance.main.address }
output "database_secret_arn" { value = aws_db_instance.main.master_user_secret[0].secret_arn }
output "redis_host" { value = aws_elasticache_replication_group.main.primary_endpoint_address }
output "redis_secret_arn" { value = aws_secretsmanager_secret.redis.arn }
output "archive_bucket" { value = aws_s3_bucket.archive.id }
output "events_table" { value = aws_dynamodb_table.events.name }
output "application_role_arn" { value = aws_iam_role.application.arn }
output "msk_cluster_arn" { value = try(aws_msk_serverless_cluster.main[0].arn, "") }
output "opensearch_url" { value = try("https://${aws_opensearch_domain.main[0].endpoint}", "") }
output "sagemaker_role_arn" { value = try(aws_iam_role.sagemaker[0].arn, "") }
