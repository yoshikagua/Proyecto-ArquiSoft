# API Gateway

Gateway centralizado del proyecto KuisiScore (FastAPI).

---

## Rol del servicio

Expone un punto único de entrada para:

- Autenticación (`/api/auth/*`) hacia `user-api`
- Storage (`/api/storage/*`) hacia `metadata-api` y `files-api`
- Pagos (`/api/payments/*`) hacia `payments_app`

---

## Configuración

Variables principales:

- `GATEWAY_PORT` (default `8000`)
- `USER_API_URL` (default `http://localhost:3000`)
- `METADATA_API_URL` (default `http://metadata-api:8000/storage` en Docker)
- `FILES_API_URL` (default `http://files-api:8000` en Docker)
- `PAYMENTS_API_URL` (default `http://payments_app:3000` en Docker)
- `FRONTEND_URL` (default `http://localhost:8080`)
- `DEBUG` (`True` / `False`)

Instalación local:

```bash
pip install -r requirements.txt
```

Ejecución local:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Endpoints disponibles

### Generales

- `GET /` → estado básico del gateway
- `GET /health` → health del gateway

### Auth

- `POST /api/auth/login` → proxy a `POST /auth/login`
- `POST /api/auth/signup` → proxy a `POST /auth/register`
- `GET /api/auth/me` → proxy a `GET /auth/me`
- `GET /api/auth/users` → proxy a `GET /auth/users`
- `PUT /api/auth/users/{id}` → proxy a `PUT /auth/users/:id`
- `POST /api/auth/recover` → proxy a `POST /auth/recover`
- `POST /api/auth/verify-recovery-code` → proxy a `POST /auth/verify-recovery-code`
- `POST /api/auth/reset-password` → proxy a `POST /auth/reset-password`
- `GET /api/auth/health` → estado y URLs configuradas

### Storage

- `GET /api/storage/health` → health del storage vía proxy
- `GET /api/storage` → GraphiQL de metadata-api
- `GET|POST|PUT|PATCH|DELETE /api/storage/{path}` → proxy transparente

### Pagos

- `GET|POST /api/payments/*` → proxy transparente hacia `payments_app`

---

## Pruebas rápidas

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/auth/health
curl http://127.0.0.1:8000/api/storage/health
curl http://127.0.0.1:8000/api/storage
```

Login con credenciales inválidas (esperado `401`):

```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nope@example.com","password":"wrong"}'
```

---

## Docker

Desde raíz del proyecto:

```bash
docker compose up -d --build api-gateway
```

Ver logs:

```bash
docker compose logs -f api-gateway
```

---

## Notas

- CORS está abierto para desarrollo y debe restringirse para producción.
