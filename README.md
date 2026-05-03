# KuisiScore – Biblioteca Musical 🎼

Proyecto de Arquitectura de Software – **Grupo 2, UNAL 2026-I**

Plataforma web para gestionar y compartir una biblioteca digital de partituras musicales.

---

## 👥 Integrantes del grupo

| Nombre                           | Correo                  |
|----------------------------------|-------------------------|
| Stiven Aguirre Granada           | staguirreg@unal.edu.co  |
| Juan Jose Alvarez Lozano         | jualvarezlo@unal.edu.co |
| David Andrés Camelo Suárez       | dcamelos@unal.edu.co    |
| Juan Manuel Torres León          | jutorresle@unal.edu.co  |
| Sergio Alejandro Reita Serrano   | sreita@unal.edu.co      |
| Maria Paula Román Arévalo        | maromana@unal.edu.co    |
| David Fernando Benjumea Mora     | dbenjumeam@unal.edu.co  |
| Julian David Rodriguez Fernandez | jrodriguezfe@unal.edu.co |
| John Jairo Paez Albino           | jopaeza@unal.edu.co     |

---

## 🧱 Arquitectura general

La solución está organizada en microservicios:

- `Front-end/`: React + Vite (UI)
- `api-gateway/`: FastAPI (punto de entrada único)
- `auth-api/`: Rust + Axum (autenticación y usuarios)
- `music-storage/`: FastAPI + Strawberry GraphQL (partituras)
- `Notification/`: PHP con RabbitMQ (notificaciones vía email)
- Infraestructura: PostgreSQL (auth + notifications), MongoDB, RabbitMQ, MinIO y MailHog

Flujo principal:

`Frontend -> API Gateway -> Auth API / Music Storage`

---

## 📁 Estructura del repositorio

| Carpeta | Descripción |
|---------|-------------|
| `Front-end/` | Aplicación frontend y cliente API |
| `api-gateway/` | Enrutamiento, proxy y health checks |
| `auth-api/` | Registro, login, sesiones y usuarios |
| `music-storage/` | Upload y consulta de partituras |
| `Notification/` | Productor y worker de notificaciones (PHP + RabbitMQ) |
| `tests/` | Pruebas `validation`, `integration` y `e2e` (incluye 35+ tests de notificaciones) |

---

## 🚀 Puesta en marcha rápida

Requisitos:

- Docker / Docker Compose

Desde la raíz:

```bash
docker compose up -d --build
```

Detener:

```bash
docker compose down
```

Detener y limpiar volúmenes:

```bash
docker compose down -v
```

---

## 🌐 Endpoints principales

- Frontend: `http://localhost:8080`
- API Gateway: `http://localhost:8000`
- Auth API (directo): `http://localhost:3000`
- Music Storage GraphQL (directo): `http://localhost:8001/storage`
- Music Storage vía Gateway: `http://localhost:8000/api/storage`
- Notification Producer API: `http://localhost:8002`
- RabbitMQ Management: `http://localhost:15672` (usuario: guest, clave: guest)
- MinIO Console: `http://localhost:9001`
- MailHog: `http://localhost:8025`

Health checks:

- `GET /health` en gateway: `http://localhost:8000/health`
- `GET /api/auth/health` en gateway: `http://localhost:8000/api/auth/health`
- `GET /api/storage/health` en gateway: `http://localhost:8000/api/storage/health`
- `GET /health` en auth-api: `http://localhost:3000/health`
- `GET /status` en notification producer: `http://localhost:8002/status`

---

## 🧪 Pruebas

Ejecutar suite completa:

```bash
python -m pytest tests/ -q
```

Por categoría:

```bash
python -m pytest tests/validation/ -q
python -m pytest tests/integration/ -q
python -m pytest tests/e2e/ -q
```

---

## 🔌 Documentación técnica

- [QUICK_START.md](./QUICK_START.md)
- [DOCKER_COMPOSE_GUIDE.md](./DOCKER_COMPOSE_GUIDE.md)
- [tests/README.md](./tests/README.md)
- [Front-end/README.md](./Front-end/README.md)
- [api-gateway/README.md](./api-gateway/README.md)
- [auth-api/README.md](./auth-api/README.md)

---

## 📌 Estado actual

- ✓ Stack Docker completo funcional (13 servicios)
- ✓ Integración frontend-gateway-auth-storage operativa
- ✓ Módulo de notificaciones integrado (PHP + RabbitMQ)
- ✓ Recuperación de contraseña operativa vía gateway
- ✓ Notificaciones de email para signup, password recovery, y eventos de música
- ✓ Perfil y catálogo conectados al backend
- ✓ Suite de pruebas completa: 35+ tests (8 validation + 12+ integration + 15+ e2e)
- ✓ Tests de notificación integrados en categorías de validation/integration/e2e