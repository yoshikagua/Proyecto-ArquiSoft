# Docker Compose Reference - Proyecto ArquiSoft

Este documento explica cómo usar los diferentes docker-compose.yml disponibles en el proyecto.

## 📍 Ubicaciones y propósitos

### 1. `/docker-compose.yml` - **Stack Completo (PRODUCCIÓN/DEMOSTRACIÓN)**

**Ubicación**: Raíz del proyecto  
**Propósito**: Orquestar TODOS los servicios juntos  
**Servicios**:
- PostgreSQL (base de datos)
- MailHog (testing de emails)
- User API (autenticación - Rust/Axum)
- Music Storage (FastAPI + GraphQL + MongoDB + MinIO)
- API Gateway (enrutador - FastAPI)
- Frontend (interfaz - React/Vite)

**Cuándo usarlo**:
- ✅ Demostración completa del proyecto
- ✅ Testing end-to-end
- ✅ Ambiente de producción
- ✅ Necesitas todo funcionando junto

**Comando**:
```bash
cd Proyecto-ArquiSoft
docker compose up -d --build
docker compose ps  # Ver estado
docker compose logs -f  # Ver logs
docker compose down  # Detener
```

**Acceso**:
- Frontend: http://localhost:8080
- API Gateway: http://localhost:8000
- User API: http://localhost:3000
- Music Storage (directo): http://localhost:8001/storage
- MinIO Console: http://localhost:9001
- MongoDB: localhost:27017
- MailHog: http://localhost:8025

---

### 2. `/auth-api/docker-compose.yml` - **Stack Mínimo (Auth-API AISLADA)**

**Ubicación**: `auth-api/`  
**Propósito**: Desarrollo aislado del backend de autenticación  
**Servicios**:
- PostgreSQL
- MailHog
- User API (Rust/Axum)

**Cuándo usarlo**:
- ✅ Backend developer trabaja SOLO en autenticación
- ✅ Testing unitario/integración del auth-api
- ✅ Desarrollo rápido sin frontend
- ✅ Recursos limitados (menos contenedores = menos RAM)

**Comando**:
```bash
cd auth-api
docker compose up -d --build
docker compose ps
docker compose logs -f
docker compose down
```

**Acceso**:
- User API: http://localhost:3000
- MailHog: http://localhost:8025
- PostgreSQL: localhost:5432

---

### 3. `/api-gateway/docker-compose.yml` - **Stack de Gateway (Testing de Gateway)**

**Ubicación**: `api-gateway/`  
**Propósito**: Desarrollo aislado del API Gateway  
**Servicios**:
- PostgreSQL
- MailHog
- User API (dependencia)
- Music Storage (dependencia)
- API Gateway (FastAPI)

**Cuándo usarlo**:
- ✅ Backend developer trabaja en Gateway
- ✅ Testing del enrutador sin frontend
- ✅ Mock de datos desde User API
- ✅ Validar transformación de payloads

**Comando**:
```bash
cd api-gateway
docker compose up -d --build
docker compose ps
docker compose logs -f
docker compose down
```

**Acceso**:
- API Gateway: http://localhost:8000
- User API: http://localhost:3000
- Music Storage (directo): http://localhost:8001/storage
- MinIO Console: http://localhost:9001
- MailHog: http://localhost:8025

---

### 4. `/Front-end/docker-compose.yml` - **Stack Completo desde Frontend**

**Ubicación**: `Front-end/`  
**Propósito**: Desarrollo del frontend con backend completo  
**Servicios**:
- PostgreSQL
- MailHog
- User API
- Music Storage
- API Gateway
- Frontend (React/Vite)

**Cuándo usarlo**:
- ✅ Frontend developer necesita backend funcionando
- ✅ Testing de UI + integración
- ✅ Desarrollo de React con backend real
- ✅ Full stack desde perspectiva del frontend

**Comando**:
```bash
cd Front-end
docker compose up -d --build
docker compose ps
docker compose logs -f
docker compose down
```

**Acceso**:
- Frontend: http://localhost:8080
- API Gateway: http://localhost:8000
- User API: http://localhost:3000
- Music Storage (directo): http://localhost:8001/storage
- MinIO Console: http://localhost:9001
- MailHog: http://localhost:8025

---

## 🎯 Matriz de decisión

| Necesito... | Usar... |
|-------------|---------|
| Todo funcionando | `/docker-compose.yml` |
| Solo desarrollar backend auth | `/auth-api/docker-compose.yml` |
| Solo desarrollar gateway | `/api-gateway/docker-compose.yml` |
| Solo desarrollar frontend | `/Front-end/docker-compose.yml` |
| Testing E2E completo | `/docker-compose.yml` |
| Demo del proyecto | `/docker-compose.yml` |

---

## ⚠️ Nota Importante

**Los nombres de contenedores son diferentes en cada compose** para evitar conflictos:
- Root compose: `proyectosoft-*` (ej: proyectosoft-postgres)
- Auth-api compose: `*-api` interno (ej: api)
- Gateway compose: `gateway-*` (ej: gateway-postgres)
- Frontend compose: `frontend-*` (ej: frontend-postgres)

**No ejecutes múltiples docker-compose simultáneamente** si usan los mismos puertos (5432, 3000, 8000, 8025).

---

## 🔍 Verificar qué puertos están en uso

```bash
# Linux/Mac
lsof -i :5432
lsof -i :3000
lsof -i :8000
lsof -i :8080

# Windows (PowerShell)
netstat -ano | findstr "5432"
netstat -ano | findstr "3000"
```

---

## 📚 Mejores prácticas

1. **Desarrollo en equipo**: Cada developer puede levantar solo lo que necesita
2. **CI/CD**: Usa el root docker-compose.yml para testing
3. **Producción**: Usa el root docker-compose.yml con variables de entorno seguros
4. **Database**: Los volumes `postgres_data` son independientes por cada compose
5. **Limpieza**: Ejecuta `docker compose down -v` para eliminar volúmenes

---

## 🆘 Troubleshooting

**Error: "Port 5432 already in use"**
```bash
docker compose down -v  # Detener y eliminar volúmenes
# O especificar puerto diferente en .env
```

**Logs vacíos o servicio no responde**
```bash
docker compose logs --tail=50 nombre-servicio
docker compose ps  # Verificar estado
docker compose restart nombre-servicio
```

**Cambios en código no se reflejan**
```bash
docker compose down  # Detener
docker compose up -d --build  # Rebuilde
```
