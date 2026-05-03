# 🚀 QUICK START – KuisiScore

Guía corta para levantar y validar el sistema completo del proyecto.

---

## 1) Requisitos

- Docker Desktop (con Docker Compose)
- Puertos libres: `3000`, `5432`, `5433`, `5672`, `8000`, `8001`, `8002`, `8025`, `8080`, `9001`, `15672`, `27017`

---

## 2) Levantar el stack completo

Desde la raíz del repositorio:

```bash
docker compose up -d --build
```

Ver estado:

```bash
docker compose ps
```

---

## 3) Endpoints principales

- Frontend: http://localhost:8080
- API Gateway: http://localhost:8000
- User API (auth): http://localhost:3000
- Music Storage (directo): http://localhost:8001/storage
- Music Storage (vía gateway): http://localhost:8000/api/storage
- Notification Producer API: http://localhost:8002
- RabbitMQ Management: http://localhost:15672 (guest/guest)
- MinIO Console: http://localhost:9001
- MailHog: http://localhost:8025

Health checks:

- Gateway: http://localhost:8000/health
- Auth vía gateway: http://localhost:8000/api/auth/health
- Storage vía gateway: http://localhost:8000/api/storage/health
- Auth directo: http://localhost:3000/health
- Notification Producer: http://localhost:8002/status

---

## 4) Smoke checks rápidos

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/auth/health
curl http://localhost:8000/api/storage/health
curl http://localhost:3000/health
curl http://localhost:8001/storage
curl http://localhost:8002/status
curl http://localhost:8002/status
```

Resultado esperado:

- Respuestas `200` en health checks
- `http://localhost:8001/storage` y `http://localhost:8000/api/storage` devuelven interfaz GraphiQL

---

## 5) Ejecutar pruebas

Desde la raíz:

```bash
python -m pytest tests/ -q
```

Por categoría:

```bash
python -m pytest tests/validation/ -q
python -m pytest tests/integration/ -q
python -m pytest tests/e2e/ -q
```

Testing específico de notificaciones:

```bash
# Validación (sin dependencias)
python -m pytest tests/validation/test_notification_validation.py -q

# Integración (con RabbitMQ y Producer)
python -m pytest tests/integration/test_notification_integration.py -q

# E2E (stack completo)
python -m pytest tests/e2e/test_notification_e2e.py -q
```

---

## 6) Detener el entorno

```bash
docker compose down
```

Para limpiar volúmenes:

```bash
docker compose down -v
```

---

## Notas

- El frontend consume auth y storage por gateway (`/api/auth/*`, `/api/storage`).
- Flujos de recuperación de contraseña (`recover`, `verify-recovery-code`, `reset-password`) están activos.
- Perfil de usuario (`/api/auth/me`, `PUT /api/auth/users/{id}`) está integrado.
- Gestión de usuarios (`GET /api/auth/users`) requiere token válido y permisos del auth-api.
- Notificaciones de email se envían automáticamente en signup y password recovery.
- RabbitMQ gestiona la cola de mensajes; ver consola en `http://localhost:15672`.
- Para detalles técnicos, ver:
  - [DOCKER_COMPOSE_GUIDE.md](./DOCKER_COMPOSE_GUIDE.md)
  - [Front-end/README.md](./Front-end/README.md)
  - [api-gateway/README.md](./api-gateway/README.md)
  - [tests/README.md](./tests/README.md) - Incluye 35+ tests de notificaciones
  - [Notification/README.md](./Notification/README.md) - Módulo de notificaciones
