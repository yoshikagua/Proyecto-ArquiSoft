"""
Integration Tests

Validan la integración entre componentes específicos:
- Frontend ↔ Gateway
- Gateway ↔ User_API
- RabbitMQ ↔ Notification Producer (12+ tests)

Módulos:
- test_frontend_gateway_connection.py: Frontend → Gateway integration
- test_gateway_user_api_connection.py: Gateway → User_API integration
- test_notification_integration.py: Notification Producer & RabbitMQ (12+ tests)

Requisitos: RabbitMQ, Notification Producer corriendo para tests de notificaciones
Ejecutar: pytest tests/integration/ -v
"""
