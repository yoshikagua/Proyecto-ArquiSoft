# Auth API (Rust + Axum)

Microservicio de autenticación y gestión de usuarios de KuisiScore.

---

## Endpoints principales

### Health

- `GET /health` → responde `200` con `healthy`

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/recover`
- `POST /auth/verify-recovery-code`
- `POST /auth/reset-password`
- `POST /auth/change-password`

### Usuarios

- `GET /auth/users`
- `PUT /auth/users/:id`

### Swagger

- `GET /swagger`

---

## Dependencias externas

- PostgreSQL
- Notification Service (vía HTTP para el flujo de correos)

---

## Modelo de roles

La API trabaja con tres roles:

- `user` (rol base)
- `admin` (gestión limitada)
- `superadmin` (dueño de la plataforma)

La autorización de `PUT /auth/users/:id` respeta esta jerarquía.

---

## Ejecución local

```bash
cd auth-api
cargo run
```

Variables esperadas (ver `.env.example`):

- `DATABASE_URL`: URL de conexión a PostgreSQL
- `JWT_SECRET`: Llave para firma de tokens
- `NOTIFICATION_URL`: URL del productor de notificaciones (ej: `http://notification-producer:8000`)

---

## Docker

Desde raíz del proyecto:

```bash
docker compose up -d --build user-api
```

Validación:

```bash
curl http://localhost:3000/health
```

---

## Desarrollo

Documentación OpenAPI disponible en `http://localhost:3000/swagger` cuando el servicio está corriendo.
