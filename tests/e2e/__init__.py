"""End-to-end tests for the full running stack.

Validan flujos críticos del sistema:
- Frontend → Gateway → User API
- Gateway → Notification Producer → RabbitMQ → Worker

Los flujos de pagos y storage se validan con tests de integración y de configuración.

Requisitos: stack completo corriendo con Docker Compose.
Ejecutar: pytest tests/e2e/ -v
"""
