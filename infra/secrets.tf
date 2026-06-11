locals {
  secret_names = [
    "devboard/${var.environment}/app-key",
    "devboard/${var.environment}/helpdesk-app-key",
    "devboard/${var.environment}/crm-app-key",
    "devboard/${var.environment}/admin-app-key",
    "devboard/${var.environment}/db-password",
    "devboard/${var.environment}/reverb-secret",
  ]
}

resource "aws_secretsmanager_secret" "app" {
  for_each = toset(local.secret_names)

  name        = each.key
  description = "DevBoard ${var.environment} secret: ${each.key}"

  # Allow immediate deletion without recovery window in non-prod for easier cleanup
  recovery_window_in_days = var.environment == "prod" ? 7 : 0

  tags = {
    Name        = each.key
    Environment = var.environment
  }
}

# NOTE: Secret values are NOT managed by Terraform.
# After `terraform apply`, populate each secret via the AWS Console or CLI:
#
#   aws secretsmanager put-secret-value \
#     --secret-id devboard/prod/app-key \
#     --secret-string "base64:your-laravel-app-key-here"
#
# Required secrets:
#   - devboard/prod/app-key          : Laravel APP_KEY for core app
#   - devboard/prod/helpdesk-app-key : Laravel APP_KEY for helpdesk
#   - devboard/prod/crm-app-key      : Laravel APP_KEY for crm
#   - devboard/prod/admin-app-key    : Laravel APP_KEY for admin
#   - devboard/prod/db-password      : RDS master password
#   - devboard/prod/reverb-secret    : Reverb REVERB_APP_SECRET value
