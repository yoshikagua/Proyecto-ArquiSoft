"""
End-to-End Tests

Validan el flujo completo del sistema con todos los servicios:
- Frontend → Gateway → User_API → PostgreSQL
- Gateway → Notification Producer → RabbitMQ → Worker (15+ tests)

Módulos:
- test_e2e_integration.py: Frontend → Gateway → Backend flows
- test_notification_e2e.py: Notification flows through Gateway (15+ tests)

Requisitos: Stack COMPLETO corriendo (docker compose up)
Duración: ~30-60 segundos
Ejecutar: pytest tests/e2e/ -v
"""
