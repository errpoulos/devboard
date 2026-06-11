resource "aws_efs_file_system" "meilisearch" {
  creation_token   = "devboard-meilisearch-${var.environment}"
  encrypted        = true
  performance_mode = "generalPurpose"
  throughput_mode  = "bursting"

  tags = {
    Name        = "devboard-meilisearch"
    Environment = var.environment
  }
}

resource "aws_efs_mount_target" "meilisearch_a" {
  file_system_id  = aws_efs_file_system.meilisearch.id
  subnet_id       = aws_subnet.private_a.id
  security_groups = [aws_security_group.efs.id]
}

resource "aws_efs_mount_target" "meilisearch_b" {
  file_system_id  = aws_efs_file_system.meilisearch.id
  subnet_id       = aws_subnet.private_b.id
  security_groups = [aws_security_group.efs.id]
}

resource "aws_efs_access_point" "meilisearch" {
  file_system_id = aws_efs_file_system.meilisearch.id

  posix_user {
    uid = 1000
    gid = 1000
  }

  root_directory {
    path = "/meili_data"
    creation_info {
      owner_uid   = 1000
      owner_gid   = 1000
      permissions = "755"
    }
  }

  tags = {
    Name        = "devboard-meilisearch-ap"
    Environment = var.environment
  }
}
