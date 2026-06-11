data "aws_caller_identity" "current" {}

# --------------------------------------------------------------------------- #
# ECS Task Execution Role
# Allows ECS to pull images from ECR and write logs to CloudWatch,
# and to read secrets from Secrets Manager.
# --------------------------------------------------------------------------- #
resource "aws_iam_role" "ecs_task_execution" {
  name = "devboard-ecs-task-execution-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "ecs-tasks.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "devboard-ecs-task-execution-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_policy" "ecs_task_execution_secrets" {
  name        = "devboard-ecs-secrets-${var.environment}"
  description = "Allow ECS task execution role to read DevBoard secrets from Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:devboard/${var.environment}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_secrets" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = aws_iam_policy.ecs_task_execution_secrets.arn
}

# --------------------------------------------------------------------------- #
# ECS Task Role (application-level permissions)
# Grants running containers access to S3 uploads bucket and Secrets Manager.
# --------------------------------------------------------------------------- #
resource "aws_iam_role" "ecs_task" {
  name = "devboard-ecs-task-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "ecs-tasks.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "devboard-ecs-task-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_iam_policy" "ecs_task" {
  name        = "devboard-ecs-task-policy-${var.environment}"
  description = "Application permissions for ECS tasks: S3 uploads + Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3UploadsAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
        ]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      },
      {
        Sid    = "S3UploadsList"
        Effect = "Allow"
        Action = ["s3:ListBucket"]
        Resource = aws_s3_bucket.uploads.arn
      },
      {
        Sid    = "SecretsManagerRead"
        Effect = "Allow"
        Action = ["secretsmanager:GetSecretValue"]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:devboard/${var.environment}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = aws_iam_policy.ecs_task.arn
}

# --------------------------------------------------------------------------- #
# EC2 Instance Profile for ECS cluster nodes
# --------------------------------------------------------------------------- #
resource "aws_iam_role" "ecs_instance" {
  name = "devboard-ecs-instance-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "devboard-ecs-instance-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "ecs_instance" {
  role       = aws_iam_role.ecs_instance.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

resource "aws_iam_instance_profile" "ecs" {
  name = "devboard-ecs-instance-profile-${var.environment}"
  role = aws_iam_role.ecs_instance.name

  tags = {
    Name        = "devboard-ecs-instance-profile-${var.environment}"
    Environment = var.environment
  }
}

# --------------------------------------------------------------------------- #
# GitHub Actions OIDC — keyless authentication
# --------------------------------------------------------------------------- #
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = {
    Name        = "github-actions-oidc"
    Environment = var.environment
  }
}

resource "aws_iam_role" "github_deploy" {
  name = "devboard-github-deploy-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
        Action    = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:errpoulos/devboard:*"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "devboard-github-deploy-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_iam_policy" "github_deploy" {
  name        = "devboard-github-deploy-policy-${var.environment}"
  description = "Permissions for GitHub Actions to build, push, and deploy DevBoard"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECRAuth"
        Effect = "Allow"
        Action = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Sid    = "ECRPush"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
        ]
        Resource = [for app in local.ecr_apps : aws_ecr_repository.apps[app].arn]
      },
      {
        Sid    = "S3SPADeploy"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject",
        ]
        Resource = [for app in local.spa_apps : "${aws_s3_bucket.spa[app].arn}/*"]
      },
      {
        Sid    = "S3SPAList"
        Effect = "Allow"
        Action = ["s3:ListBucket"]
        Resource = [for app in local.spa_apps : aws_s3_bucket.spa[app].arn]
      },
      {
        Sid    = "CloudFrontInvalidate"
        Effect = "Allow"
        Action = ["cloudfront:CreateInvalidation"]
        Resource = [for app in local.spa_apps : aws_cloudfront_distribution.spa[app].arn]
      },
      {
        Sid    = "ECSDeployment"
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:RunTask",
          "ecs:DescribeTasks",
          "ecs:RegisterTaskDefinition",
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
        ]
        Resource = "*"
      },
      {
        Sid    = "IAMPassRole"
        Effect = "Allow"
        Action = ["iam:PassRole"]
        Resource = [
          aws_iam_role.ecs_task_execution.arn,
          aws_iam_role.ecs_task.arn,
        ]
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:DescribeLogGroups",
          "logs:CreateLogGroup",
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "github_deploy" {
  role       = aws_iam_role.github_deploy.name
  policy_arn = aws_iam_policy.github_deploy.arn
}
