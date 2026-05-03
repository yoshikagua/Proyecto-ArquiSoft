# 📧 Módulo de Notificaciones por Email – KuisiScore

Sistema asincrónico de notificaciones por email usando **RabbitMQ** como broker de mensajes y **SendGrid** como proveedor SMTP.

## 👥 Equipo

**Proyecto:** Arquitectura de Software – Grupo 2, UNAL 2026-I

| Nombre                           | Correo                  |
|----------------------------------|-------------------------|
| Stiven Aguirre Granada           | staguirreg@unal.edu.co  |
| Juan Jose Alvarez Lozano         | jualvarezlo@unal.edu.co |
| David Andrés Camelo Suárez       | dcamelos@unal.edu.co    |
| Juan Manuel Torres León          | jutorresle@unal.edu.co  |
| Sergio Alejandro Reita Serrano   | sreita@unal.edu.co      |
| Maria Paula Román Arévalo        | maromana@unal.edu.co    |
| David Fernando Benjumea Mora     | dbenjumeam@unal.edu.co  |
| Julian David Rodriguez Fernandez | jrodriguezfe@unal.edu.co |
| John Jairo Paez Albino           | jopaeza@unal.edu.co     |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────┐
│      Aplicación Externa / API Gateway       │
│         POST /api/notifications/send        │
└────────────────────┬────────────────────────┘
										 │
							[Validación JWT]
										 │
				 ┌───────────▼───────────┐
				 │   Producer API (PHP)  │
				 │   puerto: 8002        │
				 │ - Valida formato      │
				 │ - Enqueue a RabbitMQ  │
				 └───────────┬───────────┘
										 │
							┌──────▼──────┐
							│  RabbitMQ   │
							│  Queue:     │
							│  notificaciones_email
							└──────┬──────┘
										 │
				 ┌───────────▼──────────┐
				 │  Email Worker (PHP)  │
				 │ - Consume mensajes   │
				 │ - Envía vía SendGrid │
				 │ - Registra logs      │
				 └───────────┬──────────┘
										 │
				 ┌───────────▼──────────┐
				 │     PHPMailer        │
				 │    + SendGrid SMTP   │
				 └───────────┬──────────┘
										 │
				 ┌───────────▼──────────┐
				 │  PostgreSQL (5432)   │
				 │  Tabla:              │
				 │  emails_enviados     │
				 └──────────────────────┘
```

---

## 🚀 Quick Start

### Requisitos
- Docker & Docker Compose
- SendGrid API Key (obtener en https://sendgrid.com)

### Pasos

1. **Clonar / estar en rama notification**
	 ```bash
	 git checkout notification
	 cd Proyecto-ArquiSoft
	 ```

2. **Configurar variables de entorno**
	 ```bash
	 cp .env.example .env
	 # Editar .env y completar:
	 # - SENDGRID_API_KEY: tu clave de SendGrid
	 # - Otros valores según necesidad
	 ```

3. **Levantar servicios**
	 ```bash
	 docker compose up -d --build
	 ```

4. **Verificar estado**
	 ```bash
	 docker compose ps
	 docker compose logs -f
	 ```

5. **Detener**
	 ```bash
	 docker compose down
	 docker compose down -v  # Si deseas limpiar volúmenes
	 ```

---

## 📡 Endpoints

### Producer API (Puerto 8002)

#### POST `/` – Enviar Email

**Request:**
```bash
curl -X POST http://localhost:8002 \
	-H "Content-Type: application/json" \
	-d '{
		"email": "usuario@example.com",
		"asunto": "Bienvenida a KuisiScore",
		"mensaje": "Gracias por registrarte en nuestra plataforma"
	}'
```

**Response (200 OK):**
```json
{
	"status": "ok",
	"message": "Mensaje enviado a la cola correctamente",
	"data": {
		"email": "usuario@example.com",
		"asunto": "Bienvenida a KuisiScore"
	}
}
```

**Response (400 Bad Request):**
```json
{
	"error": "El formato del email es inválido"
}
```

**Response (500 Internal Server Error):**
```json
{
	"error": "Error al enviar a RabbitMQ",
	"detalle": "Error message"
}
```

---

## 🔧 Servicios en Docker

| Servicio | Puerto | Descripción | Status |
|----------|--------|-------------|--------|
| **notification-producer** | 8002 | API PHP Producer | ✅ |
| **notification-worker** | N/A | Consumer RabbitMQ | ✅ |
| **notification-rabbitmq** | 5672 | Broker de mensajes | ✅ |
| **notification-rabbitmq-mgmt** | 15672 | Console de RabbitMQ | ✅ |
| **notification-postgres** | 5433 | BD PostgreSQL | ✅ |

### Acceso a Interfaces

- **RabbitMQ Management:** http://localhost:15672
	- User: `guest`
	- Pass: `guest`
  
- **PostgreSQL:** `localhost:5433`
	- User: `user`
	- Pass: `password`
	- DB: `emails_db`

---

## 📊 Base de Datos

### Tabla: `emails_enviados`

```sql
CREATE TABLE emails_enviados (
		id SERIAL PRIMARY KEY,
		email_destino VARCHAR(255) NOT NULL,
		asunto TEXT,
		mensaje TEXT,
		estado VARCHAR(20),
		error TEXT,
		fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email ON emails_enviados(email_destino);
CREATE INDEX idx_fecha ON emails_enviados(fecha_envio);
```

**Campos:**
- `id`: Identificador único
- `email_destino`: Email del destinatario
- `asunto`: Asunto del email
- `mensaje`: Contenido del email
- `estado`: `success` o `failed`
- `error`: Mensaje de error (si aplica)
- `fecha_envio`: Timestamp de envío

---

## 🔐 Variables de Entorno

Ver `.env.example` para configuración completa.

**Críticas:**
- `SENDGRID_API_KEY`: Clave de API de SendGrid (requerida para producción)
- `RABBITMQ_HOST`: Host de RabbitMQ (default: `rabbitmq`)
- `DB_HOST`: Host de PostgreSQL (default: `postgres`)

---

## 🏗️ Estructura del Proyecto

```
notification/
├── producer.php              # API HTTP Producer
├── email.php                 # Email Worker Consumer
├── Dockerfile                # Contenedor PHP
├── docker-compose.yml        # Orquestación
├── composer.json             # Dependencias PHP
├── docker/
│   └── postgres/
│       └── init.sql          # Schema de BD
├── .env.example              # Template de configuración
└── README.md                 # Este archivo
```

---

## 📦 Dependencias PHP

```json
{
	"require": {
		"php-amqplib/php-amqplib": "^3.0",
		"phpmailer/phpmailer": "^6.9"
	}
}
```

---

## 🔄 Flujo de Funcionamiento

### 1. **Enqueue (Producer)**
```
Cliente → POST /
				 ↓ Valida
				 ↓ JSON: {email, asunto, mensaje}
				 ↓ Conecta a RabbitMQ
				 ↓ Publica en queue: notificaciones_email
				 ↓ Retorna 200 OK
```

### 2. **Notification Worker**
```
Escucha queue: notificaciones_email
				 ↓ Consume mensaje
				 ↓ Extrae datos
				 ↓ Envía por SendGrid (PHPMailer)
				 ↓ Registra en PostgreSQL
				 ↓ ACK del mensaje
```

### 3. **Logging**
```
Cada email registra:
- email_destino
- asunto
- mensaje
- estado (success/failed)
- error (si aplica)
- fecha_envio (TIMESTAMP)
```

---

## ⚙️ Configuración Avanzada

### RabbitMQ
- **Host:** `rabbitmq` (en Docker network)
- **Puerto:** `5672`
- **Usuario:** `guest`
- **Contraseña:** `guest`
- **Queue:** `notificaciones_email` (durable)

### SendGrid
- **Host:** `smtp.sendgrid.net`
- **Puerto:** `587`
- **Auth:** `apikey` + `SENDGRID_API_KEY`
- **Encriptación:** `STARTTLS`

### PostgreSQL
- **Host:** `postgres` (en Docker network)
- **Puerto:** `5433` (expuesto)
- **BD:** `emails_db`
- **Usuario:** `user`
- **Contraseña:** `password`

---

## 🛠️ Desarrollo Local

### Levantar en desarrollo
```bash
docker compose up --build
```

### Ver logs en tiempo real
```bash
docker compose logs -f notification-worker
docker compose logs -f notification-producer
```

### Ejecutar comando dentro del notification-worker
```bash
docker compose exec notification-worker php -v
```

### Conectar a PostgreSQL
```bash
docker compose exec postgres psql -U user -d emails_db
```

### Acceder a RabbitMQ
```bash
# Via browser: http://localhost:15672
# Usuario: guest, Contraseña: guest
```

---

## 📝 Pruebas

### Test básico del Producer
```bash
curl -X POST http://localhost:8002 \
	-H "Content-Type: application/json" \
	-d '{
		"email": "test@example.com",
		"asunto": "Test",
		"mensaje": "Este es un email de prueba"
	}'
```

### Verificar en RabbitMQ
1. Abrir http://localhost:15672
2. Click en "Queues"
3. Buscar `notificaciones_email`
4. Verificar messages count

### Verificar en PostgreSQL
```bash
docker compose exec postgres psql -U user -d emails_db -c "SELECT * FROM emails_enviados;"
```

---

## 🔗 Integración con Prototype-2

Este módulo se integra en Prototype-2 de forma:

1. **RabbitMQ** agregado a docker-compose principal
2. **Producer** accesible vía API Gateway (`/api/notifications/send`)
3. **Auth-api** emite eventos que disparan notificaciones
4. **Frontend** visualiza historial de notificaciones

Ver `INTEGRATION.md` (en Prototype-2) para detalles.

---

## 🐛 Troubleshooting

### "Connection refused" al conectar a RabbitMQ
- Verificar que RabbitMQ esté corriendo: `docker compose ps`
- Revisar logs: `docker compose logs rabbitmq`

### "SMTP Error" en emails
- Verificar `SENDGRID_API_KEY` en `.env`
- Comprobar que SendGrid esté activo
- Revisar logs: `docker compose logs notification-worker`

### "Database connection error"
- Verificar que PostgreSQL esté corriendo
- Comprobar credenciales en `.env`
- Revisar que init.sql se ejecutó

### Worker no procesa mensajes
- Verificar que worker esté corriendo: `docker compose ps`
- Revisar logs: `docker compose logs notification-worker`
- Comprobar que queue existe en RabbitMQ Management

---

## 📚 Referencias

- [RabbitMQ](https://www.rabbitmq.com/)
- [PHPMailer](https://github.com/PHPMailer/PHPMailer)
- [SendGrid](https://sendgrid.com/)
- [php-amqplib](https://github.com/php-amqplib/php-amqplib)

---

## 📄 Licencia

Proyecto académico - UNAL 2026-I
