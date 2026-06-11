variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "domain" {
  description = "Root domain name (e.g. yourdomain.com). Subdomains are created under this."
  type        = string
}

variable "environment" {
  description = "Deployment environment name (e.g. prod, staging)"
  type        = string
  default     = "prod"
}

variable "db_password" {
  description = "Master password for the RDS MySQL instance"
  type        = string
  sensitive   = true
}

variable "db_username" {
  description = "Master username for the RDS MySQL instance"
  type        = string
  default     = "devboard"
}

variable "ec2_instance_type" {
  description = "EC2 instance type for ECS cluster nodes"
  type        = string
  default     = "t3.medium"
}

variable "ecs_ami_id" {
  description = <<-EOT
    AMI ID for ECS-optimized Amazon Linux 2 instances.
    Retrieve the latest with:
      aws ssm get-parameter \
        --name /aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id \
        --region us-east-1 \
        --query Parameter.Value \
        --output text
  EOT
  type        = string
}

variable "key_pair_name" {
  description = "Name of the EC2 key pair to attach to cluster instances for SSH access"
  type        = string
}
