# Optional edge stack, enabled only after an HTTPS API origin is available.
resource "aws_apigatewayv2_api" "api" {
  count         = var.api_origin_dns != "" ? 1 : 0
  name          = "${var.name}-api"
  protocol_type = "HTTP"
}
resource "aws_apigatewayv2_integration" "api" {
  count                  = length(aws_apigatewayv2_api.api)
  api_id                 = aws_apigatewayv2_api.api[0].id
  integration_type       = "HTTP_PROXY"
  integration_uri        = "https://${var.api_origin_dns}/{proxy}"
  integration_method     = "ANY"
  payload_format_version = "1.0"
  timeout_milliseconds   = 30000
}
resource "aws_apigatewayv2_route" "api" {
  count     = length(aws_apigatewayv2_api.api)
  api_id    = aws_apigatewayv2_api.api[0].id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.api[0].id}"
}
resource "aws_apigatewayv2_stage" "api" {
  count       = length(aws_apigatewayv2_api.api)
  api_id      = aws_apigatewayv2_api.api[0].id
  name        = "$default"
  auto_deploy = true
  default_route_settings {
    throttling_burst_limit = 100
    throttling_rate_limit  = 50
  }
}
resource "aws_apigatewayv2_domain_name" "api" {
  count       = var.public_api_domain != "" && var.api_origin_dns != "" ? 1 : 0
  domain_name = var.public_api_domain
  domain_name_configuration {
    certificate_arn = var.api_certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}
resource "aws_apigatewayv2_api_mapping" "api" {
  count       = length(aws_apigatewayv2_domain_name.api)
  api_id      = aws_apigatewayv2_api.api[0].id
  domain_name = aws_apigatewayv2_domain_name.api[0].id
  stage       = aws_apigatewayv2_stage.api[0].id
}
resource "aws_route53_record" "api" {
  count   = length(aws_apigatewayv2_domain_name.api)
  zone_id = var.route53_zone_id
  name    = var.public_api_domain
  type    = "A"
  alias {
    name                   = aws_apigatewayv2_domain_name.api[0].domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.api[0].domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}
resource "aws_wafv2_web_acl" "application" {
  name  = "${var.name}-application"
  scope = "REGIONAL"
  default_action {
    allow {}
  }
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.name}-waf"
    sampled_requests_enabled   = true
  }
  rule {
    name     = "managed-common"
    priority = 1
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name}-common"
      sampled_requests_enabled   = true
    }
  }
}
output "waf_arn" { value = aws_wafv2_web_acl.application.arn }
output "api_gateway_url" { value = try(aws_apigatewayv2_api.api[0].api_endpoint, null) }

resource "aws_cloudfront_distribution" "frontend" {
  count   = var.frontend_origin_dns != "" ? 1 : 0
  enabled = true
  aliases = var.frontend_domain != "" ? [var.frontend_domain] : []
  origin {
    domain_name = var.frontend_origin_dns
    origin_id   = "frontend"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  default_cache_behavior {
    target_origin_id       = "frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    forwarded_values {
      query_string = true
      cookies { forward = "all" }
    }
  }
  restrictions {
    geo_restriction { restriction_type = "none" }
  }
  viewer_certificate {
    cloudfront_default_certificate = var.frontend_domain == ""
    acm_certificate_arn            = var.frontend_domain != "" ? var.cloudfront_certificate_arn : null
    ssl_support_method             = var.frontend_domain != "" ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"
  }
}
resource "aws_route53_record" "frontend" {
  count   = var.frontend_domain != "" && var.frontend_origin_dns != "" ? 1 : 0
  zone_id = var.route53_zone_id
  name    = var.frontend_domain
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.frontend[0].domain_name
    zone_id                = aws_cloudfront_distribution.frontend[0].hosted_zone_id
    evaluate_target_health = false
  }
}
output "frontend_cdn" { value = try(aws_cloudfront_distribution.frontend[0].domain_name, null) }
