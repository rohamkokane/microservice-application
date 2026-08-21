resource "aws_ecs_service" "api_gateway" {
  name            = "lumina-api-gateway"
  cluster         = aws_ecs_cluster.lumina.id
  task_definition = aws_ecs_task_definition.api_gateway.arn

  desired_count = 1
  launch_type   = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }
}


resource "aws_ecs_service" "auth_service" {
  name            = "lumina-auth-service"
  cluster         = aws_ecs_cluster.lumina.id
  task_definition = aws_ecs_task_definition.auth_service.arn

  desired_count = 1
  launch_type   = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }
}


resource "aws_ecs_service" "task_service" {
  name            = "lumina-task-service"
  cluster         = aws_ecs_cluster.lumina.id
  task_definition = aws_ecs_task_definition.task_service.arn

  desired_count = 1
  launch_type   = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }
}


resource "aws_ecs_service" "frontend" {
  name            = "lumina-frontend"
  cluster         = aws_ecs_cluster.lumina.id
  task_definition = aws_ecs_task_definition.frontend.arn

  desired_count = 1
  launch_type   = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }
}