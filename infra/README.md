# DevBoard Infrastructure

Terraform configuration for the DevBoard production environment on AWS.

## Architecture

- **ECS EC2** cluster (`t3.medium`, min 1 / max 2 via ASG) running 9 services
- **RDS MySQL 8.0** (`db.t4g.micro`) in private subnets
- **ElastiCache Redis 7** (`cache.t4g.micro`) in private subnets
- **EFS** for Meilisearch persistence
- **ALB** with host-based routing + TLS termination
- **S3 + CloudFront** for 4 SPA frontends
- **ACM wildcard certificate** for `*.yourdomain.com`
- **Secrets Manager** for all sensitive values
- **GitHub OIDC** for keyless CI/CD authentication

## Prerequisites

- AWS CLI configured with permissions to create IAM, VPC, ECS, RDS, etc.
- Terraform >= 1.5 installed
- An EC2 key pair created in us-east-1 for SSH access to cluster nodes

## Step 1 — Bootstrap Remote State

Create the S3 bucket and DynamoDB table that Terraform uses to store state before running `terraform init`.

```bash
# Create state bucket
aws s3api create-bucket \
  --bucket devboard-terraform-state \
  --region us-east-1

aws s3api put-bucket-versioning \
  --bucket devboard-terraform-state \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket devboard-terraform-state \
  --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Enable block public access on state bucket
aws s3api put-public-access-block \
  --bucket devboard-terraform-state \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Create DynamoDB lock table
aws dynamodb create-table \
  --table-name devboard-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Step 2 — Find the Latest ECS-Optimized AMI

```bash
aws ssm get-parameter \
  --name /aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id \
  --region us-east-1 \
  --query Parameter.Value \
  --output text
```

Note this value — you will pass it as `ecs_ami_id` below.

## Step 3 — Initialize and Apply

```bash
cd infra

terraform init

terraform apply \
  -var="domain=yourdomain.com" \
  -var="db_password=YOUR_STRONG_PASSWORD" \
  -var="ecs_ami_id=ami-XXXXXXXXXXXX" \
  -var="key_pair_name=your-keypair-name"
```

The first apply takes approximately 15-20 minutes (RDS and CloudFront distributions are slow to provision).

## Step 4 — Post-Apply Steps

### 4a. Set secret values in Secrets Manager

Terraform creates the secret placeholders but does NOT set their values. Populate each one:

```bash
# Generate Laravel app keys first (run this in the project root):
# php artisan key:generate --show

aws secretsmanager put-secret-value \
  --secret-id devboard/prod/app-key \
  --secret-string "base64:YOUR_LARAVEL_APP_KEY"

aws secretsmanager put-secret-value \
  --secret-id devboard/prod/helpdesk-app-key \
  --secret-string "base64:YOUR_HELPDESK_APP_KEY"

aws secretsmanager put-secret-value \
  --secret-id devboard/prod/crm-app-key \
  --secret-string "base64:YOUR_CRM_APP_KEY"

aws secretsmanager put-secret-value \
  --secret-id devboard/prod/admin-app-key \
  --secret-string "base64:YOUR_ADMIN_APP_KEY"

aws secretsmanager put-secret-value \
  --secret-id devboard/prod/db-password \
  --secret-string "YOUR_DB_PASSWORD"

aws secretsmanager put-secret-value \
  --secret-id devboard/prod/reverb-secret \
  --secret-string "YOUR_REVERB_APP_SECRET"
```

### 4b. Add DNS records

Run `terraform output acm_validation_records` to get the DNS records needed to validate the ACM certificate. Add these CNAME records to your DNS provider.

Run `terraform output alb_dns_name` to get the ALB DNS name. Create the following DNS records pointing to it:

| Record | Type | Value |
|---|---|---|
| `api.yourdomain.com` | CNAME / ALIAS | ALB DNS name |
| `helpdesk-api.yourdomain.com` | CNAME / ALIAS | ALB DNS name |
| `crm-api.yourdomain.com` | CNAME / ALIAS | ALB DNS name |
| `admin-api.yourdomain.com` | CNAME / ALIAS | ALB DNS name |
| `ws.yourdomain.com` | CNAME / ALIAS | ALB DNS name |

Run `terraform output cloudfront_devboard` (and the other CloudFront outputs) to get CloudFront domain names. Create:

| Record | Type | Value |
|---|---|---|
| `app.yourdomain.com` | CNAME / ALIAS | CloudFront domain |
| `helpdesk.yourdomain.com` | CNAME / ALIAS | CloudFront domain |
| `crm.yourdomain.com` | CNAME / ALIAS | CloudFront domain |
| `admin.yourdomain.com` | CNAME / ALIAS | CloudFront domain |

### 4c. Add GitHub Actions secrets

In your GitHub repository settings → Secrets and variables → Actions, add:

| Secret name | Value |
|---|---|
| `AWS_ROLE_ARN` | Output of `terraform output github_deploy_role_arn` |
| `DB_PASSWORD` | Your RDS master password |
| `DOMAIN` | Your domain, e.g. `yourdomain.com` |
| `ECS_AMI_ID` | The AMI ID from Step 2 |
| `KEY_PAIR_NAME` | Your EC2 key pair name |
| `S3_SPA_DEVBOARD` | Output of `terraform output -json s3_spa_buckets \| jq -r '.app'` |
| `S3_SPA_HELPDESK` | Output of `terraform output -json s3_spa_buckets \| jq -r '.helpdesk'` |
| `S3_SPA_CRM` | Output of `terraform output -json s3_spa_buckets \| jq -r '.crm'` |
| `S3_SPA_ADMIN` | Output of `terraform output -json s3_spa_buckets \| jq -r '.admin'` |
| `CF_DIST_DEVBOARD` | Output of `terraform output -json cloudfront_distribution_ids \| jq -r '.app'` |
| `CF_DIST_HELPDESK` | Output of `terraform output -json cloudfront_distribution_ids \| jq -r '.helpdesk'` |
| `CF_DIST_CRM` | Output of `terraform output -json cloudfront_distribution_ids \| jq -r '.crm'` |
| `CF_DIST_ADMIN` | Output of `terraform output -json cloudfront_distribution_ids \| jq -r '.admin'` |
| `VITE_API_URL_DEVBOARD` | `https://api.yourdomain.com` |
| `VITE_API_URL_HELPDESK` | `https://helpdesk-api.yourdomain.com` |
| `VITE_API_URL_CRM` | `https://crm-api.yourdomain.com` |
| `VITE_API_URL_ADMIN` | `https://admin-api.yourdomain.com` |
| `VITE_REVERB_APP_KEY` | The Reverb app key (matches `REVERB_APP_KEY` in ECS task def) |
| `VITE_REVERB_HOST` | `ws.yourdomain.com` |
| `VITE_HELPDESK_URL` | `https://helpdesk.yourdomain.com` |

## Step 5 — First Deployment

### Run the initial database migrations

Before the first deploy, run migrations manually against the newly provisioned RDS instance from a machine that can reach the private subnet (e.g., the ECS instance via SSH):

```bash
# SSH to the ECS instance (get its IP from EC2 console)
ssh -i your-key.pem ec2-user@<instance-ip>

# Pull the devboard image and run migrations
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker run --rm \
  -e APP_KEY=<your-app-key> \
  -e DB_HOST=<rds-endpoint> \
  -e DB_PORT=3306 \
  -e DB_DATABASE=devboard \
  -e DB_USERNAME=devboard \
  -e DB_PASSWORD=<your-db-password> \
  <ecr-url>/devboard-prod/devboard:latest \
  php artisan migrate --force
```

### Deploy via git tag

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers the `deploy.yml` workflow which:
1. Builds and pushes Docker images for all 4 apps to ECR
2. Builds all 4 React SPAs and syncs them to S3, then invalidates CloudFront
3. Runs `php artisan migrate --force` as an ECS one-off task
4. Force-redeploys all 9 ECS services
5. Waits for the 4 API services to reach a stable state

## Updating the ECS AMI

When AWS releases a new ECS-optimized AMI, update the `ecs_ami_id` variable and apply:

```bash
NEW_AMI=$(aws ssm get-parameter \
  --name /aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id \
  --region us-east-1 \
  --query Parameter.Value \
  --output text)

terraform apply -var="ecs_ami_id=$NEW_AMI" ...
```

This updates the launch template; existing instances are replaced during the next ASG refresh.
