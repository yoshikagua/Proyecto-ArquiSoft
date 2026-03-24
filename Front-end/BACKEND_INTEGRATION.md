# Frontend Backend Integration

Guía de integración real del frontend con el backend vía API Gateway.

---

## URL base

El frontend consume el gateway, no servicios internos directamente.

Archivo: `Front-end/.env`

```env
VITE_API_URL=http://localhost:8000
```

Cliente centralizado: `src/lib/apiClient.ts`

---

## Endpoints usados actualmente

### Implementados y usados

- `POST /api/auth/login`
- `POST /api/auth/signup`
- `GET /api/auth/health`

### Definidos en cliente pero no expuestos aún en gateway

- `POST /api/auth/logout`
- `GET /api/auth/me`

---

## Flujo de autenticación

1. Login (`src/pages/Login.tsx`) llama `authApi.login`.
2. Gateway proxía a `user-api` (`/auth/login`).
3. Frontend guarda token en `localStorage` (`auth_token`).
4. Contexto de auth persiste sesión para navegación.

Registro (`src/components/SignUpForm.tsx`):

1. Frontend envía `email`, `password`, `name`, `first_name`, `last_name`.
2. Gateway transforma/reenvía a `POST /auth/register`.
3. Frontend muestra toast y redirige a `/login`.

---

## Verificación manual

Con stack levantado:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/auth/health
```

En UI:

- Ir a `/login`
- Probar login inválido y validar mensaje de error
- Ir a `/register` y crear usuario

---

## Estado actual de integración

- Auth (login/signup): ✅ conectado a backend real
- Health checks desde frontend: ✅
- Resto de vistas (partituras/instrumentos): parcialmente desacopladas y con secciones todavía mock según módulo

Para detalles de contratos backend, ver:

- `../FRONTEND_GATEWAY_INTEGRATION.md`
- `../api-gateway/README.md`
