# Frontend ↔ Gateway ↔ Auth API Integration

Estado actual de la integración real entre frontend, API Gateway y User API.

---

## Arquitectura de integración

```text
Frontend (React/Vite, :8080)
  -> API Gateway (FastAPI, :8000)
      -> User API (Rust/Axum, :3000)
```

Para storage:

```text
Frontend -> API Gateway (/api/storage/*) -> Music Storage (:8001 /storage)
```

---

## Variables de entorno relevantes

### Frontend

`Front-end/.env`

```env
VITE_API_URL=http://localhost:8000
```

### API Gateway

`api-gateway/.env` (o variables docker)

```env
GATEWAY_PORT=8000
USER_API_URL=http://localhost:3000
MUSIC_STORAGE_URL=http://localhost:8001/storage
FRONTEND_URL=http://localhost:8080
```

---

## Contrato de rutas (implementado hoy)

### Frontend → Gateway

- `POST /api/auth/login`
- `POST /api/auth/signup`
- `GET /api/auth/health`
- `GET /api/storage/health`
- `GET|POST|PUT|PATCH|DELETE /api/storage/*` (proxy a music-storage)

### Gateway → User API

- `POST /api/auth/login` → `POST /auth/login`
- `POST /api/auth/signup` → `POST /auth/register`

### Health checks

- `GET /api/auth/health` devuelve estado del gateway + URL configurada de auth
- `GET /health` en user-api devuelve `200` con cuerpo `healthy`

---

## Transformación de payload en signup

### Frontend envía

```json
{
  "email": "ada@example.com",
  "password": "Password123!",
  "name": "Ada Lovelace",
  "first_name": "Ada",
  "last_name": "Lovelace"
}
```

### Gateway reenvía a User API

```json
{
  "email": "ada@example.com",
  "password": "Password123!",
  "first_name": "Ada",
  "last_name": "Lovelace",
  "role_id": null
}
```

---

## Comandos de validación manual

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/auth/health
curl http://localhost:3000/health
curl http://localhost:8000/api/storage/health
```

Login de prueba (credenciales inválidas, se espera `401`):

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nope@example.com","password":"wrong"}'
```

---

## Cobertura de pruebas relacionada

- `tests/integration/test_frontend_gateway_connection.py`
- `tests/integration/test_gateway_user_api_connection.py`
- `tests/e2e/test_e2e_integration.py`

Ejecutar:

```bash
python -m pytest tests/integration/ tests/e2e/ -q
```

---

## Limitaciones actuales

- En el frontend existen helpers para `logout` y `me`, pero esas rutas no están expuestas aún en el gateway.
- El frontend combina autenticación real con otras vistas que todavía usan datos mock.
