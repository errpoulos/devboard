# --------------------------------------------------------------------------- #
# ECS Cluster
# --------------------------------------------------------------------------- #
resource "aws_ecs_cluster" "main" {
  name = "devboard-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "devboard-${var.environment}"
    Environment = var.environment
  }
}

# --------------------------------------------------------------------------- #
# CloudWatch log groups — one per service
# --------------------------------------------------------------------------- #
resource "aws_cloudwatch_log_group" "ecs" {
  for_each = toset([
    "devboard-api",
    "devboard-horizon",
    "devboard-reverb",
    "helpdesk-api",
    "helpdesk-horizon",
    "crm-api",
    "crm-horizon",
    "admin-api",
    "meilisearch",
  ])

  name              = "/ecs/devboard/${each.key}"
  retention_in_days = 7

  tags = {
    Name        = "/ecs/devboard/${each.key}"
    Environment = var.environment
  }
}

# --------------------------------------------------------------------------- #
# Launch template for ECS EC2 instances
# --------------------------------------------------------------------------- #
resource "aws_launch_template" "ecs" {
  name_prefix   = "devboard-ecs-${var.environment}-"
  image_id      = var.ecs_ami_id
  instance_type = var.ec2_instance_type
  key_name      = var.key_pair_name

  iam_instance_profile {
    arn = aws_iam_instance_profile.ecs.arn
  }

  vpc_security_group_ids = [aws_security_group.ecs.id]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    echo ECS_CLUSTER=${aws_ecs_cluster.main.name} >> /etc/ecs/ecs.config
    EOF
  )

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 30
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
    }
  }

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "devboard-ecs-${var.environment}"
      Environment = var.environment
    }
  }

  tags = {
    Name        = "devboard-ecs-lt-${var.environment}"
    Environment = var.environment
  }
}

# --------------------------------------------------------------------------- #
# Auto Scaling Group
# --------------------------------------------------------------------------- #
resource "aws_autoscaling_group" "ecs" {
  name                  = "devboard-ecs-${var.environment}"
  min_size              = 1
  max_size              = 2
  desired_capacity      = 1
  vpc_zone_identifier   = [aws_subnet.public_a.id, aws_subnet.public_b.id]
  protect_from_scale_in = true

  launch_template {
    id      = aws_launch_template.ecs.id
    version = "$Latest"
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [desired_capacity]
  }

  tag {
    key                 = "Name"
    value               = "devboard-ecs-${var.environment}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }

  tag {
    key                 = "AmazonECSManaged"
    value               = ""
    propagate_at_launch = true
  }
}

# --------------------------------------------------------------------------- #
# ECS Capacity Provider (EC2)
# --------------------------------------------------------------------------- #
resource "aws_ecs_capacity_provider" "ec2" {
  name = "devboard-ec2-${var.environment}"

  auto_scaling_group_provider {
    auto_scaling_group_arn         = aws_autoscaling_group.ecs.arn
    managed_termination_protection = "ENABLED"

    managed_scaling {
      status                    = "ENABLED"
      target_capacity           = 80
      minimum_scaling_step_size = 1
      maximum_scaling_step_size = 10
    }
  }

  tags = {
    Name        = "devboard-ec2-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = [aws_ecs_capacity_provider.ec2.name]

  default_capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.ec2.name
    weight            = 1
    base              = 1
  }
}

# --------------------------------------------------------------------------- #
# Shared locals — environment variables injected into every Laravel container
# --------------------------------------------------------------------------- #
locals {
  common_env = [
    { name = "APP_ENV",            value = "production" },
    { name = "APP_DEBUG",          value = "false" },
    { name = "LOG_CHANNEL",        value = "stderr" },
    { name = "DB_CONNECTION",      value = "mysql" },
    { name = "DB_HOST",            value = aws_db_instance.main.address },
    { name = "DB_PORT",            value = "3306" },
    { name = "DB_DATABASE",        value = "devboard" },
    { name = "DB_USERNAME",        value = var.db_username },
    { name = "REDIS_HOST",         value = aws_elasticache_cluster.redis.cache_nodes[0].address },
    { name = "REDIS_PORT",         value = "6379" },
    { name = "QUEUE_CONNECTION",   value = "redis" },
    { name = "CACHE_STORE",        value = "redis" },
    { name = "SESSION_DRIVER",     value = "redis" },
    { name = "SESSION_DOMAIN",     value = ".${var.domain}" },
    { name = "FILESYSTEM_DISK",    value = "s3" },
    { name = "AWS_DEFAULT_REGION", value = var.aws_region },
    { name = "AWS_BUCKET",         value = aws_s3_bucket.uploads.bucket },
    { name = "MEILISEARCH_HOST",   value = "http://meilisearch:7700" },
    { name = "BROADCAST_CONNECTION", value = "reverb" },
  ]

  devboard_secrets = [
    {
      name      = "APP_KEY"
      valueFrom = aws_secretsmanager_secret.app["devboard/${var.environment}/app-key"].arn
    },
    {
      name      = "DB_PASSWORD"
      valueFrom = aws_secretsmanager_secret.app["devboard/${var.environment}/db-password"].arn
    },
    {
      name      = "REVERB_APP_SECRET"
      valueFrom = aws_secretsmanager_secret.app["devboard/${var.environment}/reverb-secret"].arn
    },
  ]

  helpdesk_secrets = [
    {
      name      = "APP_KEY"
      valueFrom = aws_secretsmanager_secret.app["devboard/${var.environment}/helpdesk-app-key"].arn
    },
    {
      name      = "DB_PASSWORD"
      valueFrom = aws_secretsmanager_secret.app["devboard/${var.environment}/db-password"].arn
    },
  ]

  crm_secrets = [
    {
      name      = "APP_KEY"
      valueFrom = aws_secretsmanager_secret.app["devboard/${var.environment}/crm-app-key"].arn
    },
    {
      name      = "DB_PASSWORD"
      valueFrom = aws_secretsmanager_secret.app["devboard/${var.environment}/db-password"].arn
    },
  ]

  admin_secrets = [
    {
      name      = "APP_KEY"
      valueFrom = aws_secretsmanager_secret.app["devboard/${var.environment}/admin-app-key"].arn
    },
    {
      name      = "DB_PASSWORD"
      valueFrom = aws_secretsmanager_secret.app["devboard/${var.environment}/db-password"].arn
    },
  ]

  reverb_env = [
    { name = "REVERB_APP_ID",  value = "devboard-${var.environment}" },
    { name = "REVERB_APP_KEY", value = "devboard-${var.environment}-key" },
    { name = "REVERB_HOST",    value = "ws.${var.domain}" },
    { name = "REVERB_PORT",    value = "443" },
    { name = "REVERB_SCHEME",  value = "https" },
  ]
}

# =========================================================================== #
# devboard-api
# =========================================================================== #
resource "aws_ecs_task_definition" "devboard_api" {
  family                   = "devboard-api"
  network_mode             = "bridge"
  requires_compatibilities = ["EC2"]
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name   = "app"
      image  = "${aws_ecr_repository.apps["devboard"].repository_url}:latest"
      cpu    = 512
      memory = 512
      essential = true

      portMappings = [
        { containerPort = 80, hostPort = 0, protocol = "tcp" }
      ]

      environment = concat(local.common_env, local.reverb_env, [
        { name = "APP_URL",                  value = "https://api.${var.domain}" },
        { name = "SANCTUM_STATEFUL_DOMAINS", value = "app.${var.domain}" },
      ])

      secrets = local.devboard_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/devboard/devboard-api"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost/up || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "devboard-api"
    Environment = var.environment
  }
}

resource "aws_ecs_service" "devboard_api" {
  name            = "devboard-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.devboard_api.arn
  desired_count   = 1

  load_balancer {
    target_group_arn = aws_lb_target_group.devboard_api.arn
    container_name   = "app"
    container_port   = 80
  }

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.ec2.name
    weight            = 1
  }

  lifecycle {
    ignore_changes = [task_definition]
  }

  depends_on = [aws_lb_listener_rule.devboard_api]

  tags = {
    Name        = "devboard-api"
    Environment = var.environment
  }
}

# =========================================================================== #
# devboard-horizon
# =========================================================================== #
resource "aws_ecs_task_definition" "devboard_horizon" {
  family                   = "devboard-horizon"
  network_mode             = "bridge"
  requires_compatibilities = ["EC2"]
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "app"
      image     = "${aws_ecr_repository.apps["devboard"].repository_url}:latest"
      cpu       = 256
      memory    = 512
      essential = true
      command   = ["php", "artisan", "horizon"]

      environment = concat(local.common_env, local.reverb_env, [
        { name = "APP_URL",                  value = "https://api.${var.domain}" },
        { name = "SANCTUM_STATEFUL_DOMAINS", value = "app.${var.domain}" },
      ])

      secrets = local.devboard_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/devboard/devboard-horizon"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name        = "devboard-horizon"
    Environment = var.environment
  }
}

resource "aws_ecs_service" "devboard_horizon" {
  name            = "devboard-horizon"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.devboard_horizon.arn
  desired_count   = 1

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.ec2.name
    weight            = 1
  }

  lifecycle {
    ignore_changes = [task_definition]
  }

  tags = {
    Name        = "devboard-horizon"
    Environment = var.environment
  }
}

# =========================================================================== #
# devboard-reverb
# =========================================================================== #
resource "aws_ecs_task_definition" "devboard_reverb" {
  family                   = "devboard-reverb"
  network_mode             = "bridge"
  requires_compatibilities = ["EC2"]
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "app"
      image     = "${aws_ecr_repository.apps["devboard"].repository_url}:latest"
      cpu       = 256
      memory    = 512
      essential = true
      command   = ["php", "artisan", "reverb:start", "--host=0.0.0.0", "--port=8080"]

      portMappings = [
        { containerPort = 8080, hostPort = 0, protocol = "tcp" }
      ]

      environment = concat(local.common_env, [
        { name = "APP_URL",                  value = "https://api.${var.domain}" },
        { name = "SANCTUM_STATEFUL_DOMAINS", value = "app.${var.domain}" },
        { name = "REVERB_APP_ID",            value = "devboard-${var.environment}" },
        { name = "REVERB_APP_KEY",           value = "devboard-${var.environment}-key" },
        { name = "REVERB_HOST",              value = "0.0.0.0" },
        { name = "REVERB_PORT",              value = "8080" },
        { name = "REVERB_SCHEME",            value = "http" },
      ])

      secrets = local.devboard_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/devboard/devboard-reverb"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/up || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "devboard-reverb"
    Environment = var.environment
  }
}

resource "aws_ecs_service" "devboard_reverb" {
  name            = "devboard-reverb"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.devboard_reverb.arn
  desired_count   = 1

  load_balancer {
    target_group_arn = aws_lb_target_group.devboard_reverb.arn
    container_name   = "app"
    container_port   = 8080
  }

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.ec2.name
    weight            = 1
  }

  lifecycle {
    ignore_changes = [task_definition]
  }

  depends_on = [aws_lb_listener_rule.devboard_reverb]

  tags = {
    Name        = "devboard-reverb"
    Environment = var.environment
  }
}

# =========================================================================== #
# helpdesk-api
# =========================================================================== #
resource "aws_ecs_task_definition" "helpdesk_api" {
  family                   = "helpdesk-api"
  network_mode             = "bridge"
  requires_compatibilities = ["EC2"]
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "app"
      image     = "${aws_ecr_repository.apps["helpdesk"].repository_url}:latest"
      cpu       = 256
      memory    = 384
      essential = true

      portMappings = [
        { containerPort = 80, hostPort = 0, protocol = "tcp" }
      ]

      environment = concat(local.common_env, [
        { name = "APP_URL",                  value = "https://helpdesk-api.${var.domain}" },
        { name = "SANCTUM_STATEFUL_DOMAINS", value = "helpdesk.${var.domain}" },
      ])

      secrets = local.helpdesk_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/devboard/helpdesk-api"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost/up || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "helpdesk-api"
    Environment = var.environment
  }
}

resource "aws_ecs_service" "helpdesk_api" {
  name            = "helpdesk-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.helpdesk_api.arn
  desired_count   = 1

  load_balancer {
    target_group_arn = aws_lb_target_group.helpdesk_api.arn
    container_name   = "app"
    container_port   = 80
  }

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.ec2.name
    weight            = 1
  }

  lifecycle {
    ignore_changes = [task_definition]
  }

  depends_on = [aws_lb_listener_rule.helpdesk_api]

  tags = {
    Name        = "helpdesk-api"
    Environment = var.environment
  }
}

# =========================================================================== #
# helpdesk-horizon
# =========================================================================== #
resource "aws_ecs_task_definition" "helpdesk_horizon" {
  family                   = "helpdesk-horizon"
  network_mode             = "bridge"
  requires_compatibilities = ["EC2"]
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "app"
      image     = "${aws_ecr_repository.apps["helpdesk"].repository_url}:latest"
      cpu       = 128
      memory    = 256
      essential = true
      command   = ["php", "artisan", "horizon"]

      environment = concat(local.common_env, [
        { name = "APP_URL",                  value = "https://helpdesk-api.${var.domain}" },
        { name = "SANCTUM_STATEFUL_DOMAINS", value = "helpdesk.${var.domain}" },
      ])

      secrets = local.helpdesk_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/devboard/helpdesk-horizon"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name        = "helpdesk-horizon"
    Environment = var.environment
  }
}

resource "aws_ecs_service" "helpdesk_horizon" {
  name            = "helpdesk-horizon"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.helpdesk_horizon.arn
  desired_count   = 1

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.ec2.name
    weight            = 1
  }

  lifecycle {
    ignore_changes = [task_definition]
  }

  tags = {
    Name        = "helpdesk-horizon"
    Environment = var.environment
  }
}

# =========================================================================== #
# crm-api
# =========================================================================== #
resource "aws_ecs_task_definition" "crm_api" {
  family                   = "crm-api"
  network_mode             = "bridge"
  requires_compatibilities = ["EC2"]
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "app"
      image     = "${aws_ecr_repository.apps["crm"].repository_url}:latest"
      cpu       = 256
      memory    = 384
      essential = true

      portMappings = [
        { containerPort = 80, hostPort = 0, protocol = "tcp" }
      ]

      environment = concat(local.common_env, [
        { name = "APP_URL",                  value = "https://crm-api.${var.domain}" },
        { name = "SANCTUM_STATEFUL_DOMAINS", value = "crm.${var.domain}" },
      ])

      secrets = local.crm_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/devboard/crm-api"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost/up || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "crm-api"
    Environment = var.environment
  }
}

resource "aws_ecs_service" "crm_api" {
  name            = "crm-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.crm_api.arn
  desired_count   = 1

  load_balancer {
    target_group_arn = aws_lb_target_group.crm_api.arn
    container_name   = "app"
    container_port   = 80
  }

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.ec2.name
    weight            = 1
  }

  lifecycle {
    ignore_changes = [task_definition]
  }

  depends_on = [aws_lb_listener_rule.crm_api]

  tags = {
    Name        = "crm-api"
    Environment = var.environment
  }
}

# =========================================================================== #
# crm-horizon
# =========================================================================== #
resource "aws_ecs_task_definition" "crm_horizon" {
  family                   = "crm-horizon"
  network_mode             = "bridge"
  requires_compatibilities = ["EC2"]
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "app"
      image     = "${aws_ecr_repository.apps["crm"].repository_url}:latest"
      cpu       = 128
      memory    = 256
      essential = true
      command   = ["php", "artisan", "horizon"]

      environment = concat(local.common_env, [
        { name = "APP_URL",                  value = "https://crm-api.${var.domain}" },
        { name = "SANCTUM_STATEFUL_DOMAINS", value = "crm.${var.domain}" },
      ])

      secrets = local.crm_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/devboard/crm-horizon"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name        = "crm-horizon"
    Environment = var.environment
  }
}

resource "aws_ecs_service" "crm_horizon" {
  name            = "crm-horizon"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.crm_horizon.arn
  desired_count   = 1

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.ec2.name
    weight            = 1
  }

  lifecycle {
    ignore_changes = [task_definition]
  }

  tags = {
    Name        = "crm-horizon"
    Environment = var.environment
  }
}

# =========================================================================== #
# admin-api
# =========================================================================== #
resource "aws_ecs_task_definition" "admin_api" {
  family                   = "admin-api"
  network_mode             = "bridge"
  requires_compatibilities = ["EC2"]
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "app"
      image     = "${aws_ecr_repository.apps["admin"].repository_url}:latest"
      cpu       = 256
      memory    = 384
      essential = true

      portMappings = [
        { containerPort = 80, hostPort = 0, protocol = "tcp" }
      ]

      environment = concat(local.common_env, [
        { name = "APP_URL",                  value = "https://admin-api.${var.domain}" },
        { name = "SANCTUM_STATEFUL_DOMAINS", value = "admin.${var.domain}" },
      ])

      secrets = local.admin_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/devboard/admin-api"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost/up || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "admin-api"
    Environment = var.environment
  }
}

resource "aws_ecs_service" "admin_api" {
  name            = "admin-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.admin_api.arn
  desired_count   = 1

  load_balancer {
    target_group_arn = aws_lb_target_group.admin_api.arn
    container_name   = "app"
    container_port   = 80
  }

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.ec2.name
    weight            = 1
  }

  lifecycle {
    ignore_changes = [task_definition]
  }

  depends_on = [aws_lb_listener_rule.admin_api]

  tags = {
    Name        = "admin-api"
    Environment = var.environment
  }
}

# =========================================================================== #
# meilisearch
# =========================================================================== #
resource "aws_ecs_task_definition" "meilisearch" {
  family                   = "meilisearch"
  network_mode             = "bridge"
  requires_compatibilities = ["EC2"]
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  volume {
    name = "meili-data"
    efs_volume_configuration {
      file_system_id          = aws_efs_file_system.meilisearch.id
      transit_encryption      = "ENABLED"
      authorization_config {
        access_point_id = aws_efs_access_point.meilisearch.id
        iam             = "ENABLED"
      }
    }
  }

  container_definitions = jsonencode([
    {
      name      = "meilisearch"
      image     = "getmeili/meilisearch:v1.6"
      cpu       = 256
      memory    = 512
      essential = true

      portMappings = [
        { containerPort = 7700, hostPort = 7700, protocol = "tcp" }
      ]

      environment = [
        { name = "MEILI_ENV",              value = "production" },
        { name = "MEILI_DB_PATH",          value = "/meili_data" },
        { name = "MEILI_NO_ANALYTICS",     value = "true" },
      ]

      mountPoints = [
        {
          sourceVolume  = "meili-data"
          containerPath = "/meili_data"
          readOnly      = false
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/devboard/meilisearch"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:7700/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 30
      }
    }
  ])

  tags = {
    Name        = "meilisearch"
    Environment = var.environment
  }
}

resource "aws_ecs_service" "meilisearch" {
  name            = "meilisearch"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.meilisearch.arn
  desired_count   = 1

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.ec2.name
    weight            = 1
  }

  lifecycle {
    ignore_changes = [task_definition]
  }

  tags = {
    Name        = "meilisearch"
    Environment = var.environment
  }
}
