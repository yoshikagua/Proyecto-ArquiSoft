# API Gateway

API Gateway centralizado para los microservicios del proyecto. Construido con FastAPI.

## Descripción

Este servicio actúa como punto de entrada único para:
- **User API**: Servicio de autenticación y gestión de usuarios (Rust)
- **Frontend**: Interfaz React/TypeScript

## Requisitos

- Python 3.10+ (Anaconda o instalación estándar)
- pip

## Instalación

1. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

2. **Configurar variables de entorno**
   - Ajustar `.env` según tu entorno
   - Por defecto conecta a:
     - User API: `http://localhost:3000`
     - Frontend: `http://localhost:8080`

## Desarrollo

### Ejecutar servidor
```bash
python -m uvicorn app.main:app --reload --port 8000
```

O si prefieres Python directamente:
```bash
python -m app.main
```

### URL de documentación interactiva
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Pruebas E2E

Para validar el comportamiento del gateway de punta a punta, ejecuta primero `User_api` en `http://localhost:3000` y luego este gateway.

1. Levantar API Gateway (puerto 8000):
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

2. Probar endpoints:
```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/auth/health
curl -X POST http://127.0.0.1:8000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"123456"}'
curl -X POST http://127.0.0.1:8000/api/auth/signup -H "Content-Type: application/json" -d '{"email":"new@test.com","password":"123456","name":"Test"}'
```

Comportamiento esperado:
- `GET /health` responde `200` con `{"status":"healthy"}`
- `GET /api/auth/health` responde `200` con URLs configuradas
- `POST /api/auth/login` y `POST /api/auth/signup` responden según el estado de `User_api` y retornan su respuesta (passthrough)

## Estructura

```
api-gateway/
├── app/
│   ├── __init__.py
│   ├── main.py              # Aplicación principal
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py      # Configuración
│   └── routers/
│       ├── __init__.py
│       └── auth.py          # Rutas de autenticación
├── requirements.txt
├── .env
├── .gitignore
├── Dockerfile
└── README.md
```

## Endpoints

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/signup` - Registro
- `GET /api/auth/health` - Estado del servicio

### General
- `GET /` - Verificar que el gateway funciona
- `GET /health` - Health check

## Docker

Construir imagen:
```bash
docker build -t api-gateway .
```

Ejecutar contenedor:
```bash
docker run -p 8000:8000 --env-file .env api-gateway
```

## Próximos pasos

- [ ] Integrar endpoints adicionales de User API
- [ ] Agregar autenticación JWT
- [ ] Implementar rate limiting
- [ ] Agregar logging centralizado
- [ ] Crear docker-compose con todos los servicios
