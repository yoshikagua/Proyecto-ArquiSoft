"""
Validation Tests

Validan la configuración y sincronización del proyecto sin dependencias externas:
- Sincronización de docker-compose.yml files
- Variables de entorno
- Estructura del proyecto
- Email validation (formato, estructura de requests)

Módulos:
- test_docker_compose_sync.py: Sincronización de configs Docker
- test_env_consistency.py: Consistency de variables de entorno
- test_notification_validation.py: Validación de emails y requests (8 tests)

No requieren servicios corriendo - ideales para CI/CD rápido.
Ejecutar: pytest tests/validation/ -v
"""
"""
