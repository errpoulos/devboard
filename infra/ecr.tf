locals {
  ecr_apps = ["devboard", "helpdesk", "crm", "admin"]
}

resource "aws_ecr_repository" "apps" {
  for_each = toset(local.ecr_apps)

  name                 = "devboard-${var.environment}/${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "devboard-${var.environment}-${each.key}"
    Environment = var.environment
    App         = each.key
  }
}

resource "aws_ecr_lifecycle_policy" "apps" {
  for_each   = toset(local.ecr_apps)
  repository = aws_ecr_repository.apps[each.key].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 tagged images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Remove untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
