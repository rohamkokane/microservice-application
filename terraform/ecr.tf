resource "aws_ecr_repository" "api_gateway" {
  name = "lumina-api-gateway"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "auth_service" {
  name = "lumina-auth-service"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "task_service" {
  name = "lumina-task-service"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "frontend" {
  name = "lumina-frontend"

  image_scanning_configuration {
    scan_on_push = true
  }
}