# --------------------------------------------------------------------------- #
# ALB security group — public internet ingress
# --------------------------------------------------------------------------- #
resource "aws_security_group" "alb" {
  name        = "devboard-alb-${var.environment}"
  description = "Allow HTTP and HTTPS inbound to the Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "devboard-alb-${var.environment}"
    Environment = var.environment
  }
}

# --------------------------------------------------------------------------- #
# ECS EC2 instance security group
# --------------------------------------------------------------------------- #
resource "aws_security_group" "ecs" {
  name        = "devboard-ecs-${var.environment}"
  description = "Allow traffic from ALB and SSH for ECS cluster instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "All traffic from ALB"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "SSH for debugging"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Meilisearch internal — port 7700 from within the ECS SG
  ingress {
    description = "Meilisearch from ECS tasks"
    from_port   = 7700
    to_port     = 7700
    protocol    = "tcp"
    self        = true
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "devboard-ecs-${var.environment}"
    Environment = var.environment
  }
}

# --------------------------------------------------------------------------- #
# RDS security group
# --------------------------------------------------------------------------- #
resource "aws_security_group" "rds" {
  name        = "devboard-rds-${var.environment}"
  description = "Allow MySQL access from ECS tasks only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL from ECS"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "devboard-rds-${var.environment}"
    Environment = var.environment
  }
}

# --------------------------------------------------------------------------- #
# ElastiCache Redis security group
# --------------------------------------------------------------------------- #
resource "aws_security_group" "redis" {
  name        = "devboard-redis-${var.environment}"
  description = "Allow Redis access from ECS tasks only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Redis from ECS"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "devboard-redis-${var.environment}"
    Environment = var.environment
  }
}

# --------------------------------------------------------------------------- #
# EFS security group
# --------------------------------------------------------------------------- #
resource "aws_security_group" "efs" {
  name        = "devboard-efs-${var.environment}"
  description = "Allow NFS access from ECS tasks for EFS mounts"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "NFS from ECS"
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "devboard-efs-${var.environment}"
    Environment = var.environment
  }
}
