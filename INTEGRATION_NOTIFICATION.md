# Integración del Módulo Notification con Prototype-2

## Estructura

El módulo `Notification/` contiene un sistema completamente independiente para gestionar notificaciones por email usando:
- **RabbitMQ**: Message broker para encolar emails
- **PostgreSQL**: Base de datos para logs de emails enviados
- **PHP**: Producer API y Worker consumer

## Uso del Módulo Notification

### 1. Ejecutar el módulo de forma independiente

```bash
cd Notification
docker compose up -d --build
```

**Servicios disponibles:**
- Producer API: `http://localhost:8002`
- RabbitMQ Management: `http://localhost:15672` (guest/guest)
- PostgreSQL: `localhost:5433`

### 2. Enviar un email

```bash
curl -X POST http://localhost:8002 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "destinatario@example.com",
    "asunto": "Asunto del email",
    "mensaje": "Contenido del email"
  }'
```

Respuesta exitosa:
```json
{
  "status": "ok",
  "message": "Mensaje enviado a la cola correctamente",
  "data": {
    "email": "destinatario@example.com",
    "asunto": "Asunto del email"
  }
}
```

### 3. Integración con Prototype-2

Para integrar el módulo Notification con Prototype-2, sigue estos pasos:

#### Paso 1: Actualizar docker-compose.yml de Prototype-2

Incluir los servicios de notification en el docker-compose.yml de Prototype-2:

```yaml
version: '3.9'

services:
  # ... otros servicios de Prototype-2 ...
  
  # Servicios del módulo Notification
  notification-rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: notification-rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - main-network

  notification-postgres:
    image: postgres:15-alpine
    container_name: notification-postgres
    environment:
      POSTGRES_DB: emails_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5433:5432"
    volumes:
      - postgres_notification_data:/var/lib/postgresql/data
      - ./Notification/docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d emails_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - main-network

  notification-producer:
    build:
      context: ./Notification
      dockerfile: Dockerfile
    container_name: notification-producer
    command: ["php", "-S", "0.0.0.0:8000", "router.php"]
    ports:
      - "8002:8000"
    depends_on:
      notification-rabbitmq:
        condition: service_healthy
    environment:
      RABBITMQ_HOST: notification-rabbitmq
      RABBITMQ_PORT: 5672
    networks:
      - main-network

  notification-worker:
    build:
      context: ./Notification
      dockerfile: Dockerfile
    container_name: notification-worker
    depends_on:
      notification-rabbitmq:
        condition: service_healthy
      notification-postgres:
        condition: service_healthy
    environment:
      RABBITMQ_HOST: notification-rabbitmq
      RABBITMQ_PORT: 5672
      SENDGRID_API_KEY: ${SENDGRID_API_KEY}
      DB_HOST: notification-postgres
      DB_PORT: 5432
      DB_NAME: emails_db
      DB_USER: postgres
      DB_PASSWORD: password
    networks:
      - main-network

volumes:
  postgres_notification_data:
  # ... otros volúmenes ...

networks:
  main-network:
    driver: bridge
```

#### Paso 2: Crear endpoint en API Gateway

En `api-gateway/`, crear una ruta que delegue a notification-producer:

```python
@app.post("/api/notifications/send")
async def send_notification(request: dict):
    """
    Enviar una notificación por email
    
    Body:
    {
        "email": "destinatario@example.com",
        "asunto": "Asunto",
        "mensaje": "Contenido"
    }
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://notification-producer:8000",
            json=request,
            headers={"Content-Type": "application/json"}
        )
        return response.json()
```

#### Paso 3: Integración con Auth API (opcional)

Si quieres emitir notificaciones cuando ocurren eventos en auth-api:

```rust
// En auth-api/src/main.rs
async fn emit_notification(email: String, subject: String, message: String) {
    let client = reqwest::Client::new();
    let _ = client
        .post("http://notification-producer:8000")
        .json(&json!({
            "email": email,
            "asunto": subject,
            "mensaje": message
        }))
        .send()
        .await;
}

// Usar en endpoint de registro:
emit_notification(
    user.email,
    "Bienvenido a KuisiScore".to_string(),
    "Tu cuenta ha sido creada exitosamente".to_string()
).await;
```

### 4. Configuración de variables de entorno

**Para producción, actualizar `.env`:**

```
SENDGRID_API_KEY=sk_live_tu_clave_de_sendgrid_aqui
```

**Otros hosts a utilizar internamente:**
- `notification-producer:8000` - API de producer (desde otros servicios)
- `notification-rabbitmq:5672` - RabbitMQ (desde producer/worker)
- `notification-postgres:5432` - PostgreSQL (desde worker)

## Documentación del Módulo

- `Notification/README.md` - Documentación completa del módulo
- `Notification/DEVELOPMENT.md` - Guía de desarrollo y debugging
- `Notification/.env.example` - Variables de configuración disponibles

## Características

✅ **Producer API** - Endpoint HTTP para encolar emails  
✅ **Message Queue** - RabbitMQ para procesamiento asincrónico  
✅ **Worker Consumer** - Procesa emails y los envía vía SendGrid  
✅ **Audit Logging** - Registra todos los emails en PostgreSQL  
✅ **Health Checks** - Monitoreo de servicios  
✅ **Production Ready** - Configuración lista para producción  

## Comandos útiles

```bash
# Entrar al módulo
cd Notification

# Ver logs del worker
docker compose logs -f worker

# Consultar emails enviados
docker compose exec postgres psql -U postgres -d emails_db \
  -c "SELECT email_destino, asunto, estado FROM emails_enviados;"

# Ver cola de RabbitMQ
# Acceder a http://localhost:15672

# Detener todo
docker compose down

# Detener e limpiar volúmenes
docker compose down -v
```

## Troubleshooting

### El worker no inicia
Verificar credenciales de PostgreSQL en variables de entorno

### Los emails no se envían
Configurar `SENDGRID_API_KEY` con clave válida

### Conexión rechazada a RabbitMQ
Verificar que `RABBITMQ_HOST` sea correcto según la red de Docker

Para más detalles, consultar `Notification/DEVELOPMENT.md`
