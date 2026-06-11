# --------------------------------------------------------------------------- #
# VPC
# --------------------------------------------------------------------------- #
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "devboard-${var.environment}"
    Environment = var.environment
  }
}

# --------------------------------------------------------------------------- #
# Internet Gateway
# --------------------------------------------------------------------------- #
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "devboard-igw-${var.environment}"
    Environment = var.environment
  }
}

# --------------------------------------------------------------------------- #
# Public subnets
# --------------------------------------------------------------------------- #
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name        = "devboard-public-a-${var.environment}"
    Environment = var.environment
    Tier        = "public"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name        = "devboard-public-b-${var.environment}"
    Environment = var.environment
    Tier        = "public"
  }
}

# --------------------------------------------------------------------------- #
# Private subnets
# --------------------------------------------------------------------------- #
resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name        = "devboard-private-a-${var.environment}"
    Environment = var.environment
    Tier        = "private"
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name        = "devboard-private-b-${var.environment}"
    Environment = var.environment
    Tier        = "private"
  }
}

# --------------------------------------------------------------------------- #
# NAT Gateway (single, in first public subnet)
# --------------------------------------------------------------------------- #
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name        = "devboard-nat-eip-${var.environment}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_a.id

  tags = {
    Name        = "devboard-nat-${var.environment}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

# --------------------------------------------------------------------------- #
# Route tables
# --------------------------------------------------------------------------- #
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "devboard-public-rt-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name        = "devboard-private-rt-${var.environment}"
    Environment = var.environment
  }
}

# --------------------------------------------------------------------------- #
# Route table associations
# --------------------------------------------------------------------------- #
resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_a" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_b" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.private.id
}
