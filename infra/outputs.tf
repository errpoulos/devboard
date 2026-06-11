output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer — create CNAME/ALIAS records pointing to this"
  value       = aws_lb.main.dns_name
}

output "ecr_devboard_url" {
  description = "ECR repository URL for the core devboard app"
  value       = aws_ecr_repository.apps["devboard"].repository_url
}

output "ecr_helpdesk_url" {
  description = "ECR repository URL for the helpdesk app"
  value       = aws_ecr_repository.apps["helpdesk"].repository_url
}

output "ecr_crm_url" {
  description = "ECR repository URL for the CRM app"
  value       = aws_ecr_repository.apps["crm"].repository_url
}

output "ecr_admin_url" {
  description = "ECR repository URL for the admin app"
  value       = aws_ecr_repository.apps["admin"].repository_url
}

output "rds_endpoint" {
  description = "RDS MySQL instance endpoint (host only, no port)"
  value       = aws_db_instance.main.address
}

output "redis_endpoint" {
  description = "ElastiCache Redis node endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "cloudfront_devboard" {
  description = "CloudFront domain for the main DevBoard SPA (app.yourdomain.com)"
  value       = aws_cloudfront_distribution.spa["app"].domain_name
}

output "cloudfront_helpdesk" {
  description = "CloudFront domain for the Helpdesk SPA"
  value       = aws_cloudfront_distribution.spa["helpdesk"].domain_name
}

output "cloudfront_crm" {
  description = "CloudFront domain for the CRM SPA"
  value       = aws_cloudfront_distribution.spa["crm"].domain_name
}

output "cloudfront_admin" {
  description = "CloudFront domain for the Admin SPA"
  value       = aws_cloudfront_distribution.spa["admin"].domain_name
}

output "github_deploy_role_arn" {
  description = "ARN of the IAM role for GitHub Actions to assume via OIDC — set as AWS_ROLE_ARN secret in GitHub"
  value       = aws_iam_role.github_deploy.arn
}

output "acm_validation_records" {
  description = "DNS records required to validate the ACM wildcard certificate — add these to your DNS provider"
  value       = aws_acm_certificate.wildcard.domain_validation_options
}

output "s3_spa_buckets" {
  description = "S3 bucket names for each SPA — set as S3_SPA_* secrets in GitHub Actions"
  value = {
    for app in local.spa_apps : app => aws_s3_bucket.spa[app].bucket
  }
}

output "cloudfront_distribution_ids" {
  description = "CloudFront distribution IDs for each SPA — set as CF_DIST_* secrets in GitHub Actions"
  value = {
    for app in local.spa_apps : app => aws_cloudfront_distribution.spa[app].id
  }
}
