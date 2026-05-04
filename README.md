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
- `metadata-api/`: FastAPI + Strawberry GraphQL (metadatos de partituras)
- `files-api/`: FastAPI (archivos binarios de partituras)
- `Notification/`: PHP con RabbitMQ y SendGrid (notificaciones asíncronas vía email)
- Infraestructura: PostgreSQL (auth + notifications), MongoDB, RabbitMQ, MinIO, SendGrid y MailHog (opcional para debug)

Flujo principal:

`Frontend -> API Gateway -> Auth API / Metadata API / Files API`

---

## 📁 Estructura del repositorio

| Carpeta | Descripción |
|---------|-------------|
| `Front-end/` | Aplicación frontend y cliente API |
| `api-gateway/` | Enrutamiento, proxy y health checks |
| `auth-api/` | Registro, login, sesiones y usuarios |
| `metadata-api/` | Metadatos de partituras vía GraphQL |
| `files-api/` | Almacenamiento de archivos de partituras |
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
- Metadata API vía Gateway: `http://localhost:8000/api/storage`
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
python -m pytest -c tests/pytest.ini tests/ -q
```

Por categoría:

```bash
python -m pytest -c tests/pytest.ini tests/validation/ -q
python -m pytest -c tests/pytest.ini tests/integration/ -q
python -m pytest -c tests/pytest.ini tests/e2e/ -q
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

- ✓ Stack Docker completo funcional (reconstruido y validado)
- ✓ Integración frontend-gateway-auth-storage operativa
- ✓ Módulo de notificaciones integrado y desacoplado (PHP + RabbitMQ)
- ✓ Recuperación de contraseña operativa vía flujo asíncrono con SendGrid
- ✓ Soporte completo para caracteres especiales (UTF-8) en todo el flujo de emails
- ✓ Suite de pruebas completa validada con contenedores levantados (35+ tests de notificación)
- ✓ Perfil y catálogo conectados al backend asíncrono