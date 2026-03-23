# 🚀 Guía Rápida para Ejecutar la Aplicación Completa

## ✅ Estado Actual

✅ **Frontend:** http://localhost:8080 (Vite React) - **CORRIENDO**
✅ **API Gateway:** http://localhost:8000 (FastAPI) - **CORRIENDO**
ℹ️ **User_API:** http://localhost:3000 (Rust/Axum) - **DEPENDIENDO DEL STACK LEVANTADO**

---

## 📋 Lo Que Hemos Logrado

### 1. **Integración Frontend-Gateway Completada**

#### Cambios Realizados:
- ✅ Creado `Front-end/src/lib/apiClient.ts` - Cliente HTTP centralizado
- ✅ Actualizado `Front-end/src/pages/Login.tsx` - Login con API real
- ✅ Actualizado `Front-end/src/components/SignUpForm.tsx` - Signup con API real
- ✅ Configurado `Front-end/.env` - Variables de entorno para Vite
- ✅ Corregido `Front-end/vite-env.d.ts` - Definiciones TypeScript

### 2. **Tests Implementados**

#### Suite Completa de Tests:
```
✅ tests/integration/test_gateway_user_api_connection.py (5 tests)
   - Health check del gateway
   - Proxy de login a User_API
   - Transformación de payload de signup
   - Manejo de errores

✅ tests/integration/test_frontend_gateway_connection.py (9 tests)
   - Configuración del cliente API
   - Mapeo de rutas
   - Transformación de payloads
   - Manejo de CORS
   - Persistencia de sesión

✅ tests/e2e/test_e2e_integration.py (10 tests)
   - Validación de servicios
   - Tests E2E completos
   - Manejo de errores

✅ tests/validation/test_docker_compose_sync.py + test_env_consistency.py
   - Validación estática de docker-compose y variables de entorno
```

#### Resultado: ejecutar `pytest tests/` para validar el estado actual

---

## 🎯 Flujo Actual del Proyecto

```
┌─────────────────────────────────────────┐
│  Frontend (React/Vite)                  │
│  http://localhost:8080                  │
│                                         │
│  📄 Login.tsx                           │
│  📝 SignUpForm.tsx                      │
│  🔌 apiClient.ts                        │
└────────────────┬────────────────────────┘
                 │
                 │ HTTP Requests
                 │ (POST /api/auth/login)
                 │ (POST /api/auth/signup)
                 ▼
┌─────────────────────────────────────────┐
│  API Gateway (FastAPI)                  │
│  http://localhost:8000                  │
│                                         │
│  📍 Router: /api/auth/*                 │
│  🔄 Transforma payloads                 │
│  ✅ CORS habilitado                     │
└────────────────┬────────────────────────┘
                 │
                 │ Proxy Requests
                 │ (POST /auth/login)
                 │ (POST /auth/register)
                 ▼
┌─────────────────────────────────────────┐
│  User_API (Rust/Axum)                   │
│  http://localhost:3000                  │
│  ℹ️  Disponible al levantar auth-api     │
│                                         │
│  📍 Routes: /auth/*                     │
│  🗄️  PostgreSQL                         │
│  🔐 JWT Tokens                          │
└─────────────────────────────────────────┘
```

---

## 🔧 Cómo Ejecutar

### **Opción 1: Frontend + Gateway (SIN User_API)**
✅ Este es el estado actual - puedes verlo funcionando

**Terminal 1: Frontend**
```bash
cd Front-end
npm run dev
# Accede a: http://localhost:8080
```

**Terminal 2: API Gateway**
```bash
cd api-gateway
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# Gateway en: http://localhost:8000
```

**Resultado:** 
- ✅ Frontend carga
- ✅ Login/Signup muestran formularios
- ✅ Al enviar: Error 503 "El servicio de autenticación no está disponible"
- ✅ Esto es CORRECTO (User_API no está disponible)

---

### **Opción 2: Stack Completo (CON User_API)**
⏳ Requiere instalar Rust y compilar User_API

**Terminal 1: Frontend**
```bash
cd Front-end
npm run dev
```

**Terminal 2: API Gateway**
```bash
cd api-gateway
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3: User_API** (Requiere Rust)
```bash
cd auth-api
cargo run
# O usar Docker:
# docker-compose up
```

**Resultado:**
- ✅ Frontend carga
- ✅ Puedes crear cuentas
- ✅ Puedes iniciar sesión
- ✅ Los datos se guardan en PostgreSQL
- ✅ JWT tokens funcionan

---

## 📊 Mapeo de Rutas

| Funcionalidad | Frontend | Gateway | User_API |
|---|---|---|---|
| **Login** | POST /api/auth/login | POST /api/auth/login | POST /auth/login |
| **Signup** | POST /api/auth/signup | POST /api/auth/signup | POST /auth/register |
| **Logout** | POST /api/auth/logout | POST /api/auth/logout | POST /auth/logout |
| **Profile** | GET /api/auth/me | GET /api/auth/me | GET /auth/me |
| **Health** | GET /api/auth/health | GET /api/auth/health | GET /health |

---

## 🧪 Ejecutar Tests

### Tests Unitarios (SIN servicios corriendo)
```bash
python -m unittest discover -s tests -v
```

### Tests E2E (CON servicios corriendo)
```bash
# Asegúrate de tener:
# - Frontend en http://localhost:8080
# - Gateway en http://localhost:8000
# - User_API en http://localhost:3000

python -m pytest tests/e2e/test_e2e_integration.py -v -s
```

### Tests de Validación (SIN servicios corriendo)
```bash
python -m pytest tests/validation/ -v
```

### Resultado Esperado (Frontend + Gateway)
```
✅ TODOS LOS TESTS PASARON
   • 10 tests ejecutados
   • 0 fallos
   • Test de servicios disponibles
   • Test de transformación de payloads
   • Test de CORS
   • Test de manejo de errores
```

---

## 🎨 Interfaz del Frontend

### Página de Login
```
┌─────────────────────────────────────────┐
│  Accede a KuisiScore                    │
│                                         │
│  📧 Email: _______________              │
│  🔐 Password: _______________           │
│                                         │
│  [Iniciar Sesión]                       │
│                                         │
│  ¿No tienes cuenta? Regístrate          │
└─────────────────────────────────────────┘
```

### Página de Registro
```
┌─────────────────────────────────────────┐
│  Crea tu cuenta en KuisiScore            │
│                                         │
│  👤 Nombre:     ___________             │
│  👤 Apellido:   ___________             │
│  📧 Email:      ___________             │
│  🔐 Password:   ___________             │
│  🔐 Confirmar:  ___________             │
│                                         │
│  [Crear Cuenta]                         │
│                                         │
│  ¿Ya tienes cuenta? Inicia sesión       │
└─────────────────────────────────────────┘
```

---

## 🔄 Transformación de Datos

### Signup: Frontend → Gateway → User_API

**Frontend envía:**
```json
{
  "nombre": "Ada",
  "apellido": "Lovelace",
  "email": "ada@example.com",
  "password": "Password123!"
}
```

**Gateway transforma a:**
```json
{
  "first_name": "Ada",
  "last_name": "Lovelace",
  "email": "ada@example.com",
  "password": "Password123!",
  "role_id": null
}
```

**User_API recibe y procesa:**
- Valida el formato del email
- Hash de la contraseña con Argon2
- Crea el usuario en PostgreSQL
- Retorna JWT token

---

## 🚨 Manejo de Errores

### Errores Esperados en Frontend

```
❌ Connection Error
   "No se pudo conectar con el servidor.
    Verifica que el gateway esté corriendo en localhost:8000"
   
❌ Invalid Credentials (401)
   "Correo o contraseña incorrectos. Inténtalo de nuevo."
   
❌ Service Unavailable (503)
   "El servicio de autenticación no está disponible.
    Intenta más tarde."
   
❌ Email Already Exists (409)
   "Este correo ya está registrado. Intenta con otro."
```

---

## 📝 Documentación

- 📖 [FRONTEND_GATEWAY_INTEGRATION.md](./FRONTEND_GATEWAY_INTEGRATION.md) - Guía completa de integración
- 🧪 [tests/README.md](./tests/README.md) - Suite de tests (e2e, integration, validation)
- 🔌 [Front-end/src/lib/apiClient.ts](./Front-end/src/lib/apiClient.ts) - Cliente HTTP centralizado

---

## ✨ Resumen de Trabajo Completado

### Fase 1: Diagnóstico ✅
- Revisiones de rutas (gateway vs user_api)
- Identificación de misalignments en payloads
- Auditoría de configuración CORS

### Fase 2: Implementación ✅
- Creación del cliente API centralizado (`apiClient.ts`)
- Integración de Login.tsx con API real
- Integración de SignUpForm.tsx con API real
- Configuración de variables de entorno

### Fase 3: Testing ✅
- Suite de tests de integración (`tests/integration/`)
- Suite de tests E2E (`tests/e2e/`)
- Suite de tests de validación estática (`tests/validation/`)
- **Resultado final: ejecutar `pytest tests/` para validar el estado actual**

### Fase 4: Validación ✅
- Frontend corriendo sin errores
- Gateway corriendo sin errores
- E2E tests validando flujos completos
- Manejo de errores funcionando correctamente

---

## 🎯 Próximos Pasos

### Para completar la stack:
1. **Instalar Rust** (si no está instalado)
   ```bash
   # Windows (en PowerShell como admin)
   iwr https://win.rustup.rs -OutFile rustup-init.exe
   .\rustup-init.exe
   ```

2. **Compilar y ejecutar User_API**
   ```bash
   cd auth-api
   cargo run
   ```

3. **Crear usuarios de prueba en PostgreSQL**
   ```sql
   INSERT INTO users (email, password_hash, first_name, last_name)
   VALUES ('test@example.com', '...', 'Test', 'User');
   ```

4. **Probar el flujo completo**
   - Ir a http://localhost:8080
   - Crear una cuenta
   - Iniciar sesión
   - Ver el dashboard

---

## 📞 Soporte

¿Algo no funciona? Verifica:

```bash
# 1. ¿El frontend está corriendo?
curl http://localhost:8080

# 2. ¿El gateway está corriendo?
curl http://localhost:8000

# 3. ¿User_API está corriendo?
curl http://localhost:3000/health

# 4. ¿Las dependencias están instaladas?
cd Front-end && npm install
cd ../api-gateway && pip install -r requirements.txt

# 5. ¿Hay puertos conflictivos?
# Windows: netstat -ano | findstr :8080
# Linux/Mac: lsof -i :8080
```

---

**🎉 ¡La integración Frontend-Gateway está completa y funcionando!**

Ahora puedes ver el frontend en http://localhost:8080 y probar los formularios de login/signup.
El gateway está en http://localhost:8000 proxiando todas las requests correctamente.

Cuando tengas Rust instalado, ejecuta User_API y tendrás el stack completo funcionando. 🚀
