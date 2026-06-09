# Test Suite Documentation

## Estructura de Tests

Nota de portabilidad: `tests/conftest.py` normaliza los bundles de certificados TLS (`SSL_CERT_FILE`, `REQUESTS_CA_BUNDLE`, `CURL_CA_BUNDLE`) usando `certifi` para que los tests no dependan de variables del sistema o del entorno virtual activo.

La suite de tests está organizada en tres categorías principales para facilitar la ejecución y mantenimiento:

```
tests/
├── __init__.py
├── pytest.ini                    # Marcadores y configuración de pytest
├── README.md (este archivo)
├── e2e/                          # End-to-End Tests
│   ├── __init__.py
│   ├── test_e2e_integration.py
│   ├── test_notification_e2e.py  # ✨ Notification E2E tests (15+ tests)
│   └── test_utf8_e2e_flow.py     # 🔤 UTF-8 & Special Characters flow
├── integration/                  # Integration Tests
│   ├── __init__.py
│   ├── test_frontend_gateway_connection.py
│   ├── test_gateway_user_api_connection.py
│   ├── test_gateway_storage_connection.py   # 📦 Gateway -> Storage integration
│   ├── test_gateway_notifications.py        # 🔔 Gateway -> Notification integration
│   ├── test_notification_persistence.py      # 💾 DB Persistence verification
│   └── test_notification_integration.py  # ✨ Notification Integration (12+ tests)
└── validation/                   # Validation Tests
    ├── __init__.py
    ├── test_docker_compose_sync.py
    ├── test_env_consistency.py
    └── test_notification_validation.py  # ✨ Notification Validation (8 tests)
```

## Categorías de Tests

### 1️⃣ E2E (End-to-End) Tests
**Ubicación:** `tests/e2e/`

Validan el **flujo completo** del sistema con todos los servicios corriendo:
- **Frontend** → **API Gateway** → **Auth API** → **PostgreSQL**

**Test principal:** `test_e2e_integration.py`
- Carga del frontend
- Login con credenciales inválidas
- Signup con transformación de payload
- Validación de headers CORS
- Manejo de errores (conexión fallida, servicio no disponible)
- **Flujo UTF-8**: Validación de caracteres especiales (ñ, á, etc.) en registro y notificaciones.

**Requisitos:** 
- ✓ Frontend corriendo en `http://localhost:8080`
- ✓ API Gateway corriendo en `http://localhost:8000`
- ✓ Auth API corriendo en `http://localhost:3000`
- ✓ PostgreSQL corriendo en `localhost:5432`

**Ejecutar:**
```bash
# Ejecutar todos los E2E tests
python -m pytest -c tests/pytest.ini tests/e2e/ -v

# Ejecutar un test específico
python -m pytest -c tests/pytest.ini tests/e2e/test_e2e_integration.py::TestE2EIntegration::test_01_gateway_health_check -v

# Con salida detallada
python -m pytest -c tests/pytest.ini tests/e2e/ -v -s
```

---

### 2️⃣ Integration Tests
**Ubicación:** `tests/integration/`

Validan la **integración entre componentes** específicos:

#### `test_frontend_gateway_connection.py`
- Validación de comunicación Frontend → Gateway
- Transformación de payload (nombre → first_name/last_name)
- Configuración de CORS
- Manejo de errores

#### `test_gateway_user_api_connection.py`
- Validación de proxying Gateway → Auth API
- Transformación de requests
- Health check del gateway (dinámico)
- Servicio indisponible (503)

#### `test_gateway_storage_connection.py`
- Validación de enrutamiento Gateway → Metadata API (GraphQL)
- Validación de enrutamiento Gateway → Files API (Upload/Delete)
- Health check dinámico de servicios de almacenamiento

#### `test_gateway_notifications.py`
- Validación de enrutamiento Gateway → Notification Producer
- Health check del servicio de notificaciones en el gateway

#### `test_notification_persistence.py`
- Verificación de registros en `emails_db` tras envíos exitosos
- Validación de estados de envío (success/failed) en base de datos

**Requisitos:**
- ✓ API Gateway corriendo (puede usar mocks para Auth API)
- ✓ Dependencias: `fastapi`, `httpx`, `pydantic`

**Ejecutar:**
```bash
# Todos los tests de integración
python -m pytest -c tests/pytest.ini tests/integration/ -v

# Solo tests Frontend-Gateway
python -m pytest -c tests/pytest.ini tests/integration/test_frontend_gateway_connection.py -v

# Solo tests Gateway-Auth API
python -m pytest -c tests/pytest.ini tests/integration/test_gateway_user_api_connection.py -v
```

---

### 3️⃣ Validation Tests
**Ubicación:** `tests/validation/`

Validan **configuración estática** sin necesidad de servicios corriendo:

#### `test_docker_compose_sync.py`
Sincronización entre archivos `docker-compose.yml`:
- ✓ Existencia de todos los archivos
- ✓ Validez de sintaxis YAML
- ✓ Configuración consistente de PostgreSQL
- ✓ Puertos sin conflictos
- ✓ Versiones de imágenes compatibles
- ✓ Aislamiento de volúmenes
- ✓ Health checks configurados

Valida 4 archivos docker-compose:
1. `./docker-compose.yml` (orquestación completa)
2. `./api-gateway/docker-compose.yml` (gateway + backend minimal)
3. `./Front-end/docker-compose.yml` (full stack desde frontend)
4. `./auth-api/docker-compose.yml` (auth-api + postgres)

#### `test_env_consistency.py`
Consistencia de variables de entorno:
- ✓ Existencia de `.env.example` en todos los servicios
- ✓ Variables críticas documentadas
- ✓ Convenciones de nombres (UPPERCASE_WITH_UNDERSCORES)
- ✓ Ejemplos de valores
- ✓ URLs de API consistentes
- ✓ Checklist para producción

**Requisitos:**
- ✓ Libería: `pyyaml`
- ✗ No requiere servicios corriendo

**Ejecutar:**
```bash
# Todos los tests de validación
python -m pytest -c tests/pytest.ini tests/validation/ -v

# Solo docker-compose sync
python -m pytest -c tests/pytest.ini tests/validation/test_docker_compose_sync.py -v

# Solo env consistency
python -m pytest -c tests/pytest.ini tests/validation/test_env_consistency.py -v

# Solo notification validation
python -m pytest -c tests/pytest.ini tests/validation/test_notification_validation.py -v

# Sin requerimientos de servicios corriendo
python tests/validation/test_docker_compose_sync.py
python tests/validation/test_env_consistency.py
```

---

## 4️⃣ Notification Tests ✨ (Nuevos)

Los tests de notificación están integrados en las tres categorías para una validación completa del módulo de notificaciones:

### Notification Validation Tests
**Ubicación:** `tests/validation/test_notification_validation.py`

Validan la **estructura de datos** sin dependencias externas:
- ✓ Formato de email válido e inválido
- ✓ Estructura de requests de notificación
- ✓ Campos requeridos vs opcionales
- ✓ Tipos de datos correctos

**Tests:** 8 casos
- `test_valid_email_format`: Validación de emails válidos
- `test_invalid_email_format`: Rechazo de emails inválidos
- `test_notification_request_structure`: Estructura correcta de requests
- `test_missing_required_email_field`: Campo email obligatorio
- `test_optional_fields_defaults`: Valores por defecto

**Requisitos:**
- ✗ Ninguno - no requiere servicios

**Ejecutar:**
```bash
pytest -c tests/pytest.ini tests/validation/test_notification_validation.py -v
```

### Notification Integration Tests
**Ubicación:** `tests/integration/test_notification_integration.py`

Validan la **integración** del Notification Producer con RabbitMQ:
- ✓ Health check de Producer API
- ✓ Envío de emails a través de Producer
- ✓ Confirmación de mensajes en queue RabbitMQ
- ✓ Manejo de errores (JSON malformado, caracteres especiales)

**Tests:** 12+ casos
- `TestNotificationProducerAPI` (7 tests):
  - Health check, envío de email, errores
- `TestRabbitMQIntegration` (3 tests):
  - Queue existe, conteo de mensajes, durabilidad
- `TestErrorHandling` (4 tests):
  - JSON malformado, caracteres especiales, contenido grande

**Requisitos:**
- ✓ RabbitMQ corriendo en `localhost:15672`
- ✓ Notification Producer corriendo en `localhost:8002`

**Variables de entorno:**
```
NOTIFICATION_PRODUCER_URL=http://localhost:8002
RABBITMQ_MANAGEMENT_URL=http://localhost:15672
```

**Ejecutar:**
```bash
# Con docker-compose corriendo
docker compose up -d notification-rabbitmq notification-producer
pytest -c tests/pytest.ini tests/integration/test_notification_integration.py -v
```

### Notification E2E Tests
**Ubicación:** `tests/e2e/test_notification_e2e.py`

Validan **flujos completos** de notificación a través del Gateway:
- ✓ Notificaciones por registro de usuario
- ✓ Recuperación de contraseña
- ✓ Notificaciones por upload de música
- ✓ Batch de notificaciones concurrentes
- ✓ Contenido HTML en emails

**Tests:** 15+ casos
- `TestNotificationE2E` (5 tests):
  - Health check Gateway, endpoints, requests concurrentes
- `TestNotificationScenarios` (5 tests):
  - Registro, password recovery, upload, batch, HTML
- `TestNotificationReliability` (3 tests):
  - Reintentos, timeouts, resiliencia

**Requisitos:**
- ✓ Stack COMPLETO corriendo (docker compose up)
- ✓ Frontend, Gateway, Auth API, Notification services

**Variables de entorno:**
```
GATEWAY_URL=http://localhost:8000
NOTIFICATION_PRODUCER_URL=http://localhost:8002
```

**Ejecutar:**
```bash
# Con docker-compose completo corriendo
docker compose up -d
pytest -c tests/pytest.ini tests/e2e/test_notification_e2e.py -v
```

---

## Comparativa de Categorías

| Aspecto | E2E | Integration | Validation | Notification |
|---------|-----|-------------|-----------|--------------|
| **Alcance** | Sistema completo | Componentes específicos | Configuración estática | Módulo notificaciones |
| **Servicios requeridos** | ✓ Todos (Frontend, Gateway, Auth API, DB) | ~ Algunos (con mocks) | ✗ Ninguno | ~ Algunos (RabbitMQ, Producer) |
| **Duración** | 📊 Lenta (~30-60 seg) | 📊 Media (~10-20 seg) | 📊 Rápida (<5 seg) | 📊 Media-Rápida (~5-15 seg) |
| **Casos de uso** | Validación final pre-deploy | Desarrollo de features | CI/CD pipeline | Testing de notificaciones |
| **Ejecutar cada** | Antes de push a main | Cambios en API Gateway | Commit a rama develop | Cambios en notificaciones |

---

## Ejecución Recomendada por Escenario

### 🚀 En Desarrollo Local
```bash
# Cambio en componente específico
pytest -c tests/pytest.ini tests/integration/ -v

# Cambio en docker-compose o .env
pytest -c tests/pytest.ini tests/validation/ -v

# Cambios en notificaciones (sin stack completo)
pytest -c tests/pytest.ini tests/validation/test_notification_validation.py -v

# Cambios en integración de notificaciones (con servicios)
pytest -c tests/pytest.ini tests/integration/test_notification_integration.py -v

# Antes de commit
pytest -c tests/pytest.ini tests/integration/ tests/validation/ -v
```

### 🧪 Antes de Push a Main
```bash
# Suite completa con todos los servicios corriendo
pytest -c tests/pytest.ini tests/ -v

# O por categorías con output detallado
pytest -c tests/pytest.ini tests/e2e/ tests/integration/ tests/validation/ -v -s

# Solo tests de notificación completos
pytest -c tests/pytest.ini tests/validation/test_notification_validation.py tests/integration/test_notification_integration.py tests/e2e/test_notification_e2e.py -v
```

### 🔄 En CI/CD Pipeline
```bash
# Rápido: solo validación de configuración
pytest -c tests/pytest.ini tests/validation/ --tb=short

# Con servicios: validación + integración
pytest -c tests/pytest.ini tests/validation/ tests/integration/test_notification_integration.py --tb=short

# Completo: si hay servicios en contenedores
pytest -c tests/pytest.ini tests/ --tb=short -q
```

---

## Instalación de Dependencias

```bash
# Dependencias de testing
pip install pytest pytest-asyncio httpx pyyaml pydantic

# O desde requirements (si existe)
pip install -r requirements-test.txt
```

---

## Ejemplos de Uso

### Ejecutar tests con diferentes niveles de verbose
```bash
# Minimal output
pytest -c tests/pytest.ini tests/ -q

# Normal output
pytest -c tests/pytest.ini tests/ -v

# Detailed output con prints
pytest -c tests/pytest.ini tests/ -v -s

# Mostrar variables locales en fallos
pytest -c tests/pytest.ini tests/ -v --tb=long
```

### Ejecutar tests que contengan un patrón
```bash
# Tests que contengan "health"
pytest -c tests/pytest.ini tests/ -k health -v

# Tests que NO contengan "e2e"
pytest -c tests/pytest.ini tests/ -k "not e2e" -v
```

### Ejecutar tests de una clase específica
```bash
pytest -c tests/pytest.ini tests/e2e/test_e2e_integration.py::TestE2EIntegration -v

pytest -c tests/pytest.ini tests/integration/test_gateway_user_api_connection.py::GatewayUserApiConnectionTests -v
```

### Ejecutar un test específico
```bash
pytest -c tests/pytest.ini tests/e2e/test_e2e_integration.py::TestE2EIntegration::test_01_gateway_health_check -v
```

---

## Estructura de Cada Test

Cada archivo de test sigue esta estructura:

```python
"""
Descripción del módulo de tests
- Qué valida
- Requisitos (servicios corriendo, dependencias)
- Cómo ejecutar
"""

import unittest
from typing import Dict, List

class TestCategoryName(unittest.TestCase):
    """
    Docstring explicando qué clase de tests contiene
    """
    
    @classmethod
    def setUpClass(cls):
        """Configuración inicial (ejecuta una sola vez)"""
        # Cargar archivos, conectar servicios, etc.
        pass
    
    def test_01_description_of_test(self):
        """Descripción clara del test"""
        # Arrange: preparar datos
        # Act: ejecutar operación
        # Assert: verificar resultados
        pass
    
    def test_02_another_test(self):
        """Otro test con número"""
        pass


if __name__ == "__main__":
    # Permitir ejecución directa: python script.py
    unittest.main()
```

---

## Troubleshooting

### ❌ Error: "Connection refused"
**Problema:** Servicios no están corriendo
```bash
# Solución: Iniciar servicios con Docker Compose
docker compose up -d --build

# Verificar que estén corriendo
docker compose ps
```

### ❌ Error: "ModuleNotFoundError"
**Problema:** Rutas de importación incorrectas
```bash
# Solución: Ejecutar desde raíz del proyecto
cd /ruta/al/proyecto
python -m pytest -c tests/pytest.ini tests/
```

### ❌ Error: "YAML parsing error"
**Problema:** Archivo docker-compose.yml con sintaxis inválida
```bash
# Solución: Validar con Docker Compose
docker compose config

# O con yamllint
yamllint docker-compose.yml
```

### ❌ Error: "Timeout en tests E2E"
**Problema:** Servicios lentos o saturados
```bash
# Ejecutar con verbose para ver dónde se bloquea
pytest -c tests/pytest.ini tests/e2e/ -v -s

# Aumentar timeout (en el test code)
timeout=30  # segundos
```

---

## Mantenimiento de Tests

### ✅ Checkear regularmente:
- [ ] Tests pasan en CI/CD
- [ ] Cobertura de tests >80%
- [ ] Nuevas features tienen tests
- [ ] Bugs reportados tienen test case
- [ ] Docker images actualizadas

### 🔄 Actualizar cuando:
- Cambien puertos de servicios
- Se agreguen variables de entorno
- Se modifique estructura de docker-compose
- Se cambien endpoints de API

### 📝 Documentar:
- Nuevos tests en este README
- Cambios en estructura de tests
- Requisitos de servicios
- Configuración necesaria

---

## Recursos Adicionales

- **Pytest:** https://docs.pytest.org/
- **Docker Compose:** https://docs.docker.com/compose/
- **FastAPI Testing:** https://fastapi.tiangolo.com/advanced/testing-intro/
- **YAML Spec:** https://yaml.org/

---

## Contacto & Soporte

Para preguntas sobre los tests:
- Revisar docstrings en cada archivo
- Ejecutar con `-v -s` para ver output detallado
- Revisar el estado de CI/CD en GitHub Actions
