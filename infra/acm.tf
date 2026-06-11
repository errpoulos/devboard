# ACM wildcard certificate — must be in us-east-1 for CloudFront use.
# The provider block in versions.tf already targets us-east-1.
resource "aws_acm_certificate" "wildcard" {
  domain_name               = "*.${var.domain}"
  subject_alternative_names = [var.domain]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "devboard-wildcard-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_acm_certificate_validation" "wildcard" {
  certificate_arn         = aws_acm_certificate.wildcard.arn
  validation_record_fqdns = [for record in aws_acm_certificate.wildcard.domain_validation_options : record.resource_record_name]
}
