# AWS deployment source

This stack is source-only until the operator explicitly applies it. It creates billable infrastructure; no apply was run while preparing this release.

## Validate without provisioning

```sh
terraform init -backend=false
terraform fmt -check -recursive
terraform validate
```

Use Terraform 1.13.5 or compatible >=1.10,<2. The provider lock is included. Before deployment configure an encrypted remote state backend, AWS credentials, region, `admin_principal_arn`, and narrow `admin_cidrs`. Review the full plan and costs. The single NAT gateway and default single-AZ database are cost-oriented defaults, not a highly available production topology.

## Deployment sequence

1. Supply required variables in an uncommitted `.tfvars` file. Optional streaming/search/SageMaker are disabled by default. Keep deletion protection enabled.
2. Review/apply the base stack. Configure kubeconfig for the EKS cluster. Install the AWS Load Balancer Controller following its official installation procedure with a dedicated IAM role. Apply `../kubernetes/storage.yml`; the stack installs the EBS CSI add-on.
3. Build/push API and frontend images to the output ECR repositories. Set the frontend build argument `NEXT_PUBLIC_API_URL` to the eventual HTTPS API URL. Terraform uses immutable tags; publish a unique tag or digest per release.
4. Create namespace `cloudmind`. Create Kubernetes secret `cloudmind-secrets` from a private env file with `DATABASE_URL`, `JWT_SECRET_KEY`, `CORS_ORIGINS`, `REDIS_URL`, and chosen optional integration variables. Retrieve RDS/Redis credentials from the output Secrets Manager ARNs without committing or logging them. Use PostgreSQL TLS (`sslmode=require`) and Redis TLS (`rediss://`). Create a least-privilege database application user; do not run the app using the master account.
5. Create a private Helm values file with both image digests, serviceAccountRoleArn, ingress hosts/certificate/WAF ARN. Install into namespace **cloudmind**, matching the IRSA trust policy. Set worker.enabled when Kafka or AWS sinks are configured. API is a single replica with a persistent model volume; replicas must not be increased without shared artifacts and distributed training coordination.
6. Verify health, migrations, authentication, telemetry, training, scaling dry-run, and backups. Resolve real IAM/network/quota failures before proceeding.
7. Optionally set HTTPS origin domains to create API Gateway and CloudFront, and supply custom domains, Route53 zone and ACM certificates. CloudFront certificates must be in us-east-1. Origin names must match their TLS certificates. HTTP API has a 30-second timeout; model training should use the direct API origin when it can exceed that limit.
8. For GitOps, add your production values file (no secrets) and use `../argocd/application.yaml`. Sync manually only after images and secrets exist.

Model storage uses Retain reclaim policy. Back up database and model artifacts together. WAF is associated through ALB ingress annotations. CloudFront forwards to that origin; it does not provide a separate global WAF. Do not expose the database/Redis endpoints publicly.

References: [EBS CSI](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html), [MSK IAM Python signer](https://github.com/aws/aws-msk-iam-sasl-signer-python).
