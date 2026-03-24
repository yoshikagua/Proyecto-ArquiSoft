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
- MailHog (en desarrollo para flujo de correos)

---

## Ejecución local

```bash
cd auth-api
cargo run
```

Variables esperadas (ver `.env.example`):

- `DATABASE_URL`
- `JWT_SECRET`
- `MAIL_SMTP_HOST`
- `MAIL_SMTP_PORT`
- `MAIL_FROM`

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
