output "api_gateway_ecr_url" {
  value = aws_ecr_repository.api_gateway.repository_url
}

output "auth_service_ecr_url" {
  value = aws_ecr_repository.auth_service.repository_url
}

output "task_service_ecr_url" {
  value = aws_ecr_repository.task_service.repository_url
}

output "frontend_ecr_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.lumina.name
}

output "ecs_task_execution_role_arn" {
  value = aws_iam_role.ecs_task_execution.arn
}

output "api_gateway_log_group" {
  value = aws_cloudwatch_log_group.api_gateway.name
}

output "auth_service_log_group" {
  value = aws_cloudwatch_log_group.auth_service.name
}

output "task_service_log_group" {
  value = aws_cloudwatch_log_group.task_service.name
}

output "frontend_log_group" {
  value = aws_cloudwatch_log_group.frontend.name
}

output "vpc_id" {
  value = aws_vpc.lumina.id
}

output "public_subnet_a_id" {
  value = aws_subnet.public_a.id
}

output "public_subnet_b_id" {
  value = aws_subnet.public_b.id
}

output "ecs_security_group_id" {
  value = aws_security_group.ecs.id
}