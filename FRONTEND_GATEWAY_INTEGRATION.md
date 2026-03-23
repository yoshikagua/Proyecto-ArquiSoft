# Validación de Conexiones Frontend - Gateway - User_API

## 📋 Resumen

Este documento describe cómo validar que el **API Gateway** está correctamente integrado con el **Frontend** (React/Vite) y el **User_API** (Rust/Axum).

La integración sigue este flujo:

```
Frontend (React/Vite)
    ↓ HTTP Request
    ↓ POST /api/auth/login
API Gateway (FastAPI)
    ↓ Proxy Request
    ↓ POST /auth/login (transforms payload)
User_API (Rust/Axum)
    ↓ Process Request
    ↓ PostgreSQL
Response travels back through same path
```

---

## 🔧 Configuración de Componentes

### Frontend Configuración

**Ubicación:** `Front-end/src/lib/apiClient.ts`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Endpoints mapeados:
// POST /api/auth/login   → conecta a Gateway
// POST /api/auth/signup  → conecta a Gateway  
// POST /api/auth/logout  → conecta a Gateway
// GET  /api/auth/health  → conecta a Gateway
```

**Variables de Entorno:** `Front-end/.env` (crear si no existe)

```bash
VITE_API_URL=http://localhost:8000
```

### Gateway Configuración

**Ubicación:** `api-gateway/app/routers/auth.py`

- **Puerto:** 8000
- **Rutas:**
  - `POST /api/auth/login` → Proxies to `USER_API_URL/auth/login`
  - `POST /api/auth/signup` → Proxies to `USER_API_URL/auth/register`
  - `POST /api/auth/logout` → Proxies to `USER_API_URL/auth/logout`
  - `GET /api/auth/health` → Returns health of gateway + User_API

**Variables de Entorno:** `api-gateway/.env`

```bash
GATEWAY_PORT=8000
USER_API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:8080
```

**CORS Configuración:** `api-gateway/app/main.py`

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En dev "*", en prod especificar orígenes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### User_API Configuración

**Ubicación:** `auth-api/` (Rust backend)

- **Puerto:** 3000
- **Rutas:**
  - `POST /auth/login` ← recibe del Gateway
  - `POST /auth/register` ← recibe del Gateway
  - `POST /auth/logout`
  - `GET /auth/me`

---

## 🚀 Pasos de Validación Manual

### 1️⃣ Verificar Estructura de Archivos

```bash
# Verificar que los componentes tengan las integraciones
grep -r "authApi" Front-end/src/
grep -r "apiClient" Front-end/src/

# Esperado:
# - Front-end/src/lib/apiClient.ts (NUEVO)
# - Front-end/src/pages/Login.tsx (ACTUALIZADO)
# - Front-end/src/components/SignUpForm.tsx (ACTUALIZADO)
```

### 2️⃣ Verificar Importaciones en Componentes

**Login.tsx debe tener:**
```typescript
import { authApi, ApiClientError } from "@/lib/apiClient";
```

**SignUpForm.tsx debe tener:**
```typescript
import { authApi, ApiClientError } from "@/lib/apiClient";
import { useNavigate } from "react-router-dom";
```

### 3️⃣ Iniciar Servicios en Orden

**Terminal 1 - PostgreSQL (si está en local):**
```bash
# Windows con Chocolatey
psql -U postgres
# CREATE DATABASE auth_db;
# CREATE USER authuser WITH PASSWORD 'authpass';
# GRANT ALL PRIVILEGES ON DATABASE auth_db TO authuser;
```

**Terminal 2 - User_API (Rust backend):**
```bash
cd auth-api
cargo run
# Esperado: "Server running on http://localhost:3000"
```

**Terminal 3 - API Gateway:**
```bash
cd api-gateway
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
# Esperado: "Application startup complete"
```

**Terminal 4 - Frontend (React/Vite):**
```bash
cd Front-end
npm install
npm run dev
# Esperado: "Local: http://localhost:5173" o "http://localhost:8080"
```

### 4️⃣ Validación con cURL

**Test 1: Health Check del Gateway**
```bash
curl -X GET http://localhost:8000/api/auth/health
# Esperado: 200 OK con estado de servicios
```

**Test 2: Login Request**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
# Esperado: 200 OK con JWT token si las credenciales son válidas
# o 401 Unauthorized si no son válidas
```

**Test 3: Signup Request**
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "Password123!",
    "name": "Ada Lovelace"
  }'
# Esperado: 201 Created con datos del usuario
# o 409 Conflict si el email ya existe
```

**Test 4: Validar CORS**
```bash
curl -X OPTIONS http://localhost:8000/api/auth/login \
  -H "Origin: http://localhost:8080" \
  -H "Access-Control-Request-Method: POST"
# Esperado: 200 OK con headers CORS
```

### 5️⃣ Validación en el Frontend

**En la página Login:**
1. Abrir http://localhost:5173 (o puerto configurado)
2. Navegar a la página de Login
3. Ingresar credenciales válidas:
   - Email: `test@example.com`
   - Password: `password123`
4. Hacer clic en "Iniciar Sesión"

**Puntos de validación:**
- ✓ El formulario se deshabilita (indicador de carga)
- ✓ No hay error ("Correo o contraseña incorrectos si fallan")
- ✓ Se redirige a `/partituras`
- ✓ El token JWT se guarda en `localStorage` bajo `auth_token`
- ✓ Los datos del usuario se guardan en `localStorage` bajo `auth_user`

**En la página Signup:**
1. Hacer clic en "Crear Cuenta"
2. Ingresar datos:
   - Nombre: `Juan`
   - Apellido: `García`
   - Email: `juan@example.com`
   - Password: `Password123!`
   - Confirmar Password: `Password123!`
3. Hacer clic en "Crear Cuenta"

**Puntos de validación:**
- ✓ El botón muestra "Creando cuenta..." durante el envío
- ✓ Se muestra toast de éxito
- ✓ Se redirige a `/login` después de 1 segundo
- ✓ El usuario ahora puede iniciar sesión

---

## 📊 Mapeo de Rutas (Frontend → Gateway → User_API)

| Frontend | Gateway | User_API |
|----------|      --|----------|
| POST /api/auth/login | POST /api/auth/login | POST /auth/login |
| POST /api/auth/signup | POST /api/auth/signup | POST /auth/register |
| POST /api/auth/logout | POST /api/auth/logout | POST /auth/logout |
| GET /api/auth/me | GET /api/auth/me | GET /auth/me |
| GET /api/auth/health | GET /api/auth/health | (múltiples) |

---

## 🔐 Transformación de Payloads

### Signup Request

**Frontend envía:**
```json
{
  "email": "ada@example.com",
  "password": "Password123!",
  "name": "Ada Lovelace",
  "first_name": "Ada",
  "last_name": "Lovelace"
}
```

**Gateway transforma a:**
```json
{
  "email": "ada@example.com",
  "password": "Password123!",
  "first_name": "Ada",
  "last_name": "Lovelace",
  "role_id": null
}
```

**User_API recibe:**
```json
{
  "email": "ada@example.com",
  "password": "Password123!",
  "first_name": "Ada",
  "last_name": "Lovelace"
}
```

---

## ⚠️ Manejo de Errores

### Status Codes

| Code | Escenario | Frontend Message |
|------|-----------|------------------|
| 200 | Login exitoso | Redirigir a /partituras |
| 201 | Signup exitoso | Toast + Redirigir a /login |
| 400 | Bad request | "Los datos proporcionados no son válidos" |
| 401 | Unauthorized | "Correo o contraseña incorrectos" |
| 409 | Conflict (email existe) | "Este correo ya está registrado" |
| 503 | Service unavailable | "El servicio no está disponible" |
| 0 | Connection error | "No se pudo conectar con el servidor" |

---

## 📝 Archivos Modificados

### Nuevos Archivos
- ✅ `Front-end/src/lib/apiClient.ts` - Cliente HTTP centralizado

### Archivos Actualizados
- ✅ `Front-end/src/pages/Login.tsx` - Integración con API real
- ✅ `Front-end/src/components/SignUpForm.tsx` - Integración con API real

### Tests Añadidos
- ✅ `tests/integration/test_frontend_gateway_connection.py` - Validación de conexiones
- ✅ `tests/integration/test_gateway_user_api_connection.py` - Integración Gateway ↔ User_API

---

## 🧪 Ejecutar Tests

```bash
# Todos los tests
python -m pytest tests/ -v

# Solo tests de integración frontend-gateway
python -m pytest tests/integration/test_frontend_gateway_connection.py -v

# Solo tests de integración gateway-user_api
python -m pytest tests/integration/test_gateway_user_api_connection.py -v
```

---

## ✅ Checklist Final

- [ ] `apiClient.ts` creado con todas las rutas
- [ ] `Login.tsx` actualizado con `authApi.login()`
- [ ] `SignUpForm.tsx` actualizado con `authApi.signup()`
- [ ] Variables de entorno configuradas
- [ ] CORS habilitado en el gateway
- [ ] PostgreSQL/MongoDB están corriendo localmente
- [ ] User_API está corriendo en http://localhost:3000
- [ ] API Gateway está corriendo en http://localhost:8000
- [ ] Frontend está corriendo en http://localhost:8080 (o 5173)
- [ ] Login funciona con credenciales válidas
- [ ] Signup crea un nuevo usuario correctamente
- [ ] Token JWT se guarda en localStorage
- [ ] Datos de usuario se guardan en localStorage
- [ ] Todos los tests pasan ✓

---

## 🔍 Debugging

Si algo no funciona:

1. **No se conecta al gateway:**
   - Verifica que el gateway esté corriendo en puerto 8000
   - Revisa la consola del navegador (F12 → Console)
   - Busca errores de CORS

2. **Credenciales rechazadas:**
   - Verifica que el usuario existe en PostgreSQL
   - Revisa los logs de User_api
   - Comprueba que la contraseña es correcta

3. **Signup retorna 409:**
   - El email ya está registrado
   - Intenta con otro email único

4. **Signup retorna 422:**
   - Los datos no pasan validación en User_api
   - Verifica que el email es válido y la contraseña cumple requisitos

---

## 📚 Referencias

- Frontend: `Front-end/src/lib/apiClient.ts`
- Gateway: `api-gateway/app/routers/auth.py`
- User_API: `auth-api/src/handlers/auth_handler.rs`
- Tests de integración: `tests/integration/*.py`
- Tests E2E: `tests/e2e/*.py`

