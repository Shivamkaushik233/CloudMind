variable "region" {
  type    = string
  default = "us-east-1"
}
variable "name" {
  type    = string
  default = "cloudmind"
}
variable "kubernetes_version" {
  type    = string
  default = "1.34"
}
variable "admin_principal_arn" {
  type        = string
  description = "Existing IAM role/user allowed to administer this EKS cluster"
}
variable "admin_cidrs" {
  type        = list(string)
  description = "Trusted operator public IP CIDRs for EKS API access"
}
variable "node_instance_types" {
  type    = list(string)
  default = ["t3.large"]
}
variable "node_count" {
  type    = number
  default = 2
}
variable "spot_node_count" {
  type    = number
  default = 0
}
variable "database_instance_class" {
  type    = string
  default = "db.t4g.micro"
}
variable "database_multi_az" {
  type    = bool
  default = false
}
variable "redis_node_type" {
  type    = string
  default = "cache.t4g.micro"
}
variable "enable_streaming" {
  type    = bool
  default = false
}
variable "enable_search" {
  type    = bool
  default = false
}
variable "enable_sagemaker" {
  type    = bool
  default = false
}
variable "deletion_protection" {
  type    = bool
  default = true
}
variable "bedrock_model_arns" {
  type    = list(string)
  default = []
}
variable "public_api_domain" {
  type    = string
  default = ""
}
variable "frontend_domain" {
  type    = string
  default = ""
}
variable "route53_zone_id" {
  type    = string
  default = ""
}
variable "api_origin_dns" {
  type        = string
  default     = ""
  description = "HTTPS ALB DNS/domain after Helm ingress is provisioned"
}
variable "api_certificate_arn" {
  type    = string
  default = ""
}
variable "cloudfront_certificate_arn" {
  type        = string
  default     = ""
  description = "ACM certificate in us-east-1 covering frontend_domain"
}

variable "frontend_origin_dns" {
  type        = string
  default     = ""
  description = "HTTPS frontend origin with a valid matching certificate"
}
