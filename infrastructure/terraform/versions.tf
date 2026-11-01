terraform {
  required_version = ">= 1.10, < 2"
  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 6.0" }
    random = { source = "hashicorp/random", version = "~> 3.7" }
  }
}
provider "aws" {
  region = var.region
  default_tags { tags = { Project = "CloudMind", Environment = var.name, ManagedBy = "Terraform" } }
}
data "aws_availability_zones" "available" { state = "available" }
data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
locals {

  azs       = slice(data.aws_availability_zones.available.names, 0, 2)
  oidc_host = replace(aws_eks_cluster.main.identity[0].oidc[0].issuer, "https://", "")
  account   = data.aws_caller_identity.current.account_id

}
