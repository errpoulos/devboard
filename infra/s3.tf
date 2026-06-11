# --------------------------------------------------------------------------- #
# Uploads bucket — private, for user file attachments served through app
# --------------------------------------------------------------------------- #
resource "aws_s3_bucket" "uploads" {
  bucket = "devboard-uploads-${var.environment}"

  tags = {
    Name        = "devboard-uploads-${var.environment}"
    Environment = var.environment
    Purpose     = "uploads"
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# --------------------------------------------------------------------------- #
# SPA buckets — one per frontend app, accessed via CloudFront OAC
# --------------------------------------------------------------------------- #
locals {
  spa_apps = ["app", "helpdesk", "crm", "admin"]
}

resource "aws_s3_bucket" "spa" {
  for_each = toset(local.spa_apps)

  bucket = "devboard-spa-${each.key}-${var.environment}"

  tags = {
    Name        = "devboard-spa-${each.key}-${var.environment}"
    Environment = var.environment
    Purpose     = "spa"
    App         = each.key
  }
}

resource "aws_s3_bucket_public_access_block" "spa" {
  for_each = toset(local.spa_apps)

  bucket = aws_s3_bucket.spa[each.key].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "spa" {
  for_each = toset(local.spa_apps)

  bucket = aws_s3_bucket.spa[each.key].id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
