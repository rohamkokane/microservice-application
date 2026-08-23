resource "aws_service_discovery_private_dns_namespace" "lumina" {
  name        = "lumina.local"
  description = "Private DNS namespace for Lumina ECS services"

  vpc = aws_vpc.lumina.id
}


resource "aws_service_discovery_service" "auth" {
  name = "auth"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.lumina.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }
}


resource "aws_service_discovery_service" "task" {
  name = "task"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.lumina.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }
}