locals {
  # Maps bucket key → subdomain prefix
  spa_subdomains = {
    app      = "app"
    helpdesk = "helpdesk"
    crm      = "crm"
    admin    = "admin"
  }
}

# --------------------------------------------------------------------------- #
# Origin Access Controls (OAC) — one per SPA bucket
# --------------------------------------------------------------------------- #
resource "aws_cloudfront_origin_access_control" "spa" {
  for_each = toset(local.spa_apps)

  name                              = "devboard-spa-${each.key}-${var.environment}"
  description                       = "OAC for DevBoard ${each.key} SPA bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# --------------------------------------------------------------------------- #
# CloudFront distributions — one per SPA
# --------------------------------------------------------------------------- #
resource "aws_cloudfront_distribution" "spa" {
  for_each = toset(local.spa_apps)

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "DevBoard ${each.key} SPA — ${var.environment}"
  aliases             = ["${local.spa_subdomains[each.key]}.${var.domain}"]
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.spa[each.key].bucket_regional_domain_name
    origin_id                = "s3-spa-${each.key}"
    origin_access_control_id = aws_cloudfront_origin_access_control.spa[each.key].id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-spa-${each.key}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    cache_policy_id = data.aws_cloudfront_cache_policy.caching_optimized.id

    response_headers_policy_id = aws_cloudfront_response_headers_policy.spa_security[each.key].id
  }

  # SPA fallback: return index.html for 403/404 (S3 returns 403 for missing keys)
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.wildcard.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  depends_on = [aws_acm_certificate_validation.wildcard]

  tags = {
    Name        = "devboard-spa-${each.key}-${var.environment}"
    Environment = var.environment
    App         = each.key
  }
}

# Managed cache policy for optimized S3 caching
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

# Security response headers policy
resource "aws_cloudfront_response_headers_policy" "spa_security" {
  for_each = toset(local.spa_apps)

  name    = "devboard-spa-${each.key}-security-${var.environment}"
  comment = "Security headers for DevBoard ${each.key} SPA"

  security_headers_config {
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }
    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
  }
}

# --------------------------------------------------------------------------- #
# S3 bucket policies — allow CloudFront OAC to GetObject
# --------------------------------------------------------------------------- #
resource "aws_s3_bucket_policy" "spa" {
  for_each = toset(local.spa_apps)

  bucket = aws_s3_bucket.spa[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.spa[each.key].arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.spa[each.key].arn
          }
        }
      }
    ]
  })
}
