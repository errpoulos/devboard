resource "aws_db_subnet_group" "main" {
  name        = "devboard-${var.environment}"
  description = "Private subnet group for DevBoard RDS instance"
  subnet_ids  = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = {
    Name        = "devboard-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_db_instance" "main" {
  identifier        = "devboard-${var.environment}"
  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = "db.t4g.micro"
  allocated_storage = 20
  storage_type      = "gp3"

  db_name  = "devboard"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  skip_final_snapshot = true
  deletion_protection = false
  multi_az            = false

  auto_minor_version_upgrade = true
  publicly_accessible        = false

  tags = {
    Name        = "devboard-${var.environment}"
    Environment = var.environment
  }
}
