resource "aws_ecs_service" "api_gateway" {
  name            = "lumina-api-gateway"
  cluster         = aws_ecs_cluster.lumina.id
  task_definition = aws_ecs_task_definition.api_gateway.arn

  desired_count = 1
  launch_type   = "FARGATE"

  load_balancer {
    target_group_arn = aws_lb_target_group.api_gateway.arn
    container_name   = "api-gateway"
    container_port   = 3000
  }

  network_configuration {
    subnets = [
      aws_subnet.public_a.id,
      aws_subnet.public_b.id
    ]

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
    subnets = [
      aws_subnet.public_a.id,
      aws_subnet.public_b.id
    ]

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
    subnets = [
      aws_subnet.public_a.id,
      aws_subnet.public_b.id
    ]

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

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 80
  }

  network_configuration {
    subnets = [
      aws_subnet.public_a.id,
      aws_subnet.public_b.id
    ]

    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }
}