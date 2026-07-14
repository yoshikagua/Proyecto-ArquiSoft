# 🛠️ DEVELOPMENT GUIDE - Módulo Notificaciones

Guía de desarrollo para trabajar en el módulo de notificaciones.

---

## 📋 Setup Inicial

### Requisitos
- Docker & Docker Compose
- Git
- Cuenta de Gmail con SMTP habilitado (para producción)

### Pasos

1. **Clonar y abrir el módulo**
   ```bash
   git clone <repo>
   cd Proyecto-ArquiSoft
   cd Notification
   ```

2. **Copiar archivo de configuración**
   ```bash
   cp .env.example .env
   ```

3. **Editar .env con tus credenciales**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=kuisiscore.notifications@gmail.com
   SMTP_PASSWORD=cqgg yzdq aidw dxwq
   RABBITMQ_HOST=rabbitmq
   DB_HOST=postgres
   # ... otros valores
   ```

4. **Levantar servicios**
   ```bash
   docker compose up -d --build
   ```

5. **Verificar que todo funciona**
   ```bash
   docker compose ps
   docker compose logs notification-worker
   ```

---

## 📁 Estructura de Archivos

```
notification/
├── producer.php              # API HTTP para encolar emails
├── email.php                 # Worker que consume y envía
├── Dockerfile                # Imagen PHP
├── docker-compose.yml        # Orquestación de servicios
├── composer.json             # Dependencias PHP
├── .env.example              # Template de variables
├── docker/
│   └── postgres/
│       └── init.sql          # Script de inicialización BD
├── README.md                 # Documentación principal
└── DEVELOPMENT.md            # Este archivo
```

---

## 🔧 Comandos Útiles

### Gestión de Servicios

**Levantar servicios**
```bash
docker compose up -d --build
```

**Ver estado**
```bash
docker compose ps
```

**Ver logs en tiempo real**
```bash
docker compose logs -f
docker compose logs -f notification-worker
docker compose logs -f notification-producer
docker compose logs -f notification-rabbitmq
```

**Detener servicios**
```bash
docker compose down
```

**Detener y eliminar volúmenes (WARNING: pierde datos)**
```bash
docker compose down -v
```

---

## 🧪 Testing

### Test 1: Enviar email vía Producer

```bash
curl -X POST http://localhost:8002 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "asunto": "Test Email",
    "mensaje": "Contenido del email de prueba"
  }'
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "message": "Mensaje enviado a la cola correctamente",
  "data": {
    "email": "test@example.com",
    "asunto": "Test Email"
  }
}
```

### Test 2: Verificar en RabbitMQ

1. Abrir http://localhost:15672
2. Usuario: `guest`, Contraseña: `guest`
3. Click en "Queues" tab
4. Buscar `notificaciones_email`
5. Verificar que tiene messages

### Test 3: Verificar en PostgreSQL

```bash
docker compose exec postgres psql -U user -d emails_db
```

Dentro de psql:
```sql
SELECT * FROM emails_enviados;
```

### Test 4: Ver logs del notification-worker

```bash
docker compose logs -f notification-worker
```

Debería mostrar:
```
Worker listo...
[INFO] Enviado a test@example.com
```

---

## 🐛 Debugging

### El worker no procesa mensajes

1. Verificar que está corriendo:
   ```bash
   docker compose ps | grep notification-worker
   ```

2. Ver logs:
   ```bash
   docker compose logs notification-worker
   ```

3. Verificar conexión a RabbitMQ:
   ```bash
   docker compose exec notification-worker ping -c 3 notification-rabbitmq
   ```

4. Reiniciar:
   ```bash
   docker compose restart notification-worker
   ```

### Error "Connection refused" en RabbitMQ

```bash
docker compose logs rabbitmq
docker compose restart rabbitmq
```

### Error en SMTP

1. Verificar credenciales SMTP en `.env`
2. Ver logs del worker
3. Probar acceso SMTP de Gmail

### Error de BD

```bash
docker compose logs postgres
docker compose exec postgres psql -U user -d emails_db -c "SELECT * FROM emails_enviados;"
```

---

## 📝 Cambios Comunes

### Cambiar email remitente

Editar en `email.php`:
```php
class Config
{
    const FROM_EMAIL = 'nuevo@example.com';
    const FROM_NAME = 'Nuevo Nombre';
}
```

O mejor, usar variables de entorno (TODO).

### Cambiar queue name

En `producer.php`:
```php
$channel->queue_declare('nueva_queue_name', false, true, false, false);
```

En `email.php`:
```php
$channel->queue_declare('nueva_queue_name', false, true, false, false);
```

### Agregar más campos al email

En `producer.php`:
```php
$data = [
    "email" => $email,
    "asunto" => $asunto,
    "mensaje" => $mensaje,
    "timestamp" => time(),
    "nuevo_campo" => $input['nuevo_campo'] ?? null  // Nuevo
];
```

En `email.php`:
```php
$nuevocampo = $datos['nuevo_campo'] ?? null;
```

### Cambiar reintentos

En `email.php`:
```php
const MAX_RETRIES = 5;  // Cambiar de 3 a 5
```

---

## 🚀 Deployment a Producción

### En Prototype-2

1. Copiar archivos específicos de notification
2. Integrar RabbitMQ en docker-compose principal
3. Crear ruta `/api/notifications/send` en api-gateway
4. Extender auth-api para emitir eventos

### Variables de Producción

```bash
# .env en producción
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=kuisiscore.notifications@gmail.com
SMTP_PASSWORD=tu_app_password_de_gmail
RABBITMQ_USER=production_user
RABBITMQ_PASS=strong_password
DB_USER=prod_db_user
DB_PASSWORD=strong_password
```

### Security Checklist

- [ ] API Gateway valida JWT
- [ ] RabbitMQ con credenciales fuertes
- [ ] PostgreSQL con credenciales fuertes
- [ ] Credenciales SMTP en secretos (no en git)
- [ ] Logs sin mostrar datos sensibles
- [ ] HTTPS para endpoints

---

## 📚 Documentación Adicional

- [RabbitMQ Docs](https://www.rabbitmq.com/documentation.html)
- [PHPMailer Docs](https://github.com/PHPMailer/PHPMailer/wiki)
- [Gmail SMTP](https://support.google.com/mail/answer/7126229)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)

---

## 📞 Soporte

Para problemas específicos:

1. Revisar logs: `docker compose logs -f`
2. Verificar `.env` está correcto
3. Comprobar que servicios están corriendo: `docker compose ps`
4. Ver sección "Troubleshooting" en [README.md](README.md)

---

## 🔄 Workflow de Cambios

1. Hacer cambios en archivos `.php`
2. Reconstruir imagen:
   ```bash
   docker compose build
   ```
3. Reiniciar servicios:
   ```bash
   docker compose up -d
   ```
4. Verificar logs:
   ```bash
   docker compose logs -f
   ```
5. Testear cambios
6. Commitear cambios

---

## ✅ Checklist Pre-Merge

Antes de hacer merge a Prototype-2:

- [ ] README.md completo
- [ ] .env.example con todas las variables
- [ ] docker-compose.yml funcional
- [ ] Dockerfile optimizado
- [ ] composer.json con versiones exactas
- [ ] Tests básicos pasados
- [ ] Logs sin errores
- [ ] Puertos no conflictuan
- [ ] Variables de entorno sensibles en .env (no en archivos)
- [ ] Documentación clara

---

**Última actualización:** 2026-05-02
