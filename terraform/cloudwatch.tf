resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/ecs/lumina-api-gateway"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "auth_service" {
  name              = "/ecs/lumina-auth-service"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "task_service" {
  name              = "/ecs/lumina-task-service"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/lumina-frontend"
  retention_in_days = 7
}