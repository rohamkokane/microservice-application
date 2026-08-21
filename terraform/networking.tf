resource "aws_vpc" "lumina" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "lumina-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.lumina.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "ap-south-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "lumina-public-subnet"
  }
}

resource "aws_internet_gateway" "lumina" {
  vpc_id = aws_vpc.lumina.id

  tags = {
    Name = "lumina-igw"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.lumina.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.lumina.id
  }

  tags = {
    Name = "lumina-public-route-table"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "ecs" {
  name        = "lumina-ecs-sg"
  description = "Security group for Lumina ECS services"
  vpc_id      = aws_vpc.lumina.id

  ingress {
    description = "API Gateway"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Frontend"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "lumina-ecs-sg"
  }
}