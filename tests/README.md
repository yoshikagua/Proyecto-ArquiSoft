# Test Suite Documentation

## Estructura de Tests

La suite de tests está organizada en tres categorías principales para facilitar la ejecución y mantenimiento:

```
tests/
├── __init__.py
├── README.md (este archivo)
├── e2e/                          # End-to-End Tests
│   ├── __init__.py
│   └── test_e2e_integration.py
├── integration/                  # Integration Tests
│   ├── __init__.py
│   ├── test_frontend_gateway_connection.py
│   └── test_gateway_user_api_connection.py
└── validation/                   # Validation Tests
    ├── __init__.py
    ├── test_docker_compose_sync.py
    └── test_env_consistency.py
```

## Categorías de Tests

### 1️⃣ E2E (End-to-End) Tests
**Ubicación:** `tests/e2e/`

Validan el **flujo completo** del sistema con todos los servicios corriendo:
- **Frontend** → **API Gateway** → **User_API** → **PostgreSQL**

**Test principal:** `test_e2e_integration.py`
- Carga del frontend
- Login con credenciales inválidas
- Signup con transformación de payload
- Validación de headers CORS
- Manejo de errores (conexión fallida, servicio no disponible)

**Requisitos:** 
- ✓ Frontend corriendo en `http://localhost:8080`
- ✓ API Gateway corriendo en `http://localhost:8000`
- ✓ User_API corriendo en `http://localhost:3000`
- ✓ PostgreSQL corriendo en `localhost:5432`

**Ejecutar:**
```bash
# Ejecutar todos los E2E tests
python -m pytest tests/e2e/ -v

# Ejecutar un test específico
python -m pytest tests/e2e/test_e2e_integration.py::TestE2EIntegration::test_01_gateway_health_check -v

# Con salida detallada
python -m pytest tests/e2e/ -v -s
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
- Validación de proxying Gateway → User_API
- Transformación de requests
- Health check del gateway
- Servicio indisponible (503)

**Requisitos:**
- ✓ API Gateway corriendo (puede usar mocks para User_API)
- ✓ Dependencias: `fastapi`, `httpx`, `pydantic`

**Ejecutar:**
```bash
# Todos los tests de integración
python -m pytest tests/integration/ -v

# Solo tests Frontend-Gateway
python -m pytest tests/integration/test_frontend_gateway_connection.py -v

# Solo tests Gateway-User_API
python -m pytest tests/integration/test_gateway_user_api_connection.py -v
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
python -m pytest tests/validation/ -v

# Solo docker-compose sync
python -m pytest tests/validation/test_docker_compose_sync.py -v

# Solo env consistency
python -m pytest tests/validation/test_env_consistency.py -v

# Sin requerimientos de servicios corriendo
python tests/validation/test_docker_compose_sync.py
python tests/validation/test_env_consistency.py
```

---

## Comparativa de Categorías

| Aspecto | E2E | Integration | Validation |
|---------|-----|-------------|-----------|
| **Alcance** | Sistema completo | Componentes específicos | Configuración estática |
| **Servicios requeridos** | ✓ Todos (Frontend, Gateway, User_API, DB) | ~ Algunos (con mocks) | ✗ Ninguno |
| **Duración** | 📊 Lenta (~30-60 seg) | 📊 Media (~10-20 seg) | 📊 Rápida (<5 seg) |
| **Casos de uso** | Validación final pre-deploy | Desarrollo de features | CI/CD pipeline |
| **Ejecutar cada** | Antes de push a main | Cambios en API Gateway | Commit a rama develop |

---

## Ejecución Recomendada por Escenario

### 🚀 En Desarrollo Local
```bash
# Cambio en componente específico
pytest tests/integration/ -v

# Cambio en docker-compose o .env
pytest tests/validation/ -v

# Antes de commit
pytest tests/integration/ tests/validation/ -v
```

### 🧪 Antes de Push a Main
```bash
# Suite completa con todos los servicios corriendo
pytest tests/ -v

# O por categorías con output detallado
pytest tests/e2e/ tests/integration/ tests/validation/ -v -s
```

### 🔄 En CI/CD Pipeline
```bash
# Rápido: solo validación de configuración
pytest tests/validation/ --tb=short

# Completo: si hay servicios en contenedores
pytest tests/ --tb=short -q
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
pytest tests/ -q

# Normal output
pytest tests/ -v

# Detailed output con prints
pytest tests/ -v -s

# Mostrar variables locales en fallos
pytest tests/ -v --tb=long
```

### Ejecutar tests que contengan un patrón
```bash
# Tests que contengan "health"
pytest tests/ -k health -v

# Tests que NO contengan "e2e"
pytest tests/ -k "not e2e" -v
```

### Ejecutar tests de una clase específica
```bash
pytest tests/e2e/test_e2e_integration.py::TestE2EIntegration -v

pytest tests/integration/test_gateway_user_api_connection.py::GatewayUserApiConnectionTests -v
```

### Ejecutar un test específico
```bash
pytest tests/e2e/test_e2e_integration.py::TestE2EIntegration::test_01_gateway_health_check -v
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
python -m pytest tests/
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
pytest tests/e2e/ -v -s

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
