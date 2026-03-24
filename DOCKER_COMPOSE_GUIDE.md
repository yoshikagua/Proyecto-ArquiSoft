# Docker Compose Guide – Proyecto ArquiSoft

Referencia de los `docker-compose.yml` del repositorio y cuándo usar cada uno.

---

## 1) Stack completo (`/docker-compose.yml`)

**Uso recomendado** para demo, validación global y pruebas E2E.

Servicios:

- `frontend` (`:8080`)
- `api-gateway` (`:8000`)
- `user-api` (`:3000`)
- `music-storage` (`:8001` -> `:8000` interno)
- `postgres` (`:5432`)
- `mongo` (`:27017`)
- `minio` (`:9000`, `:9001`)
- `mailhog` (`:1025`, `:8025`)

Comandos:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f
docker compose down
```

---

## 2) Stack auth aislado (`/auth-api/docker-compose.yml`)

Útil para desarrollo del microservicio de autenticación.

Comandos:

```bash
cd auth-api
docker compose up -d --build
docker compose ps
docker compose down
```

---

## 3) Stack gateway aislado (`/api-gateway/docker-compose.yml`)

Útil para desarrollo de proxy/enrutamiento del gateway.

Comandos:

```bash
cd api-gateway
docker compose up -d --build
docker compose ps
docker compose down
```

---

## 4) Stack frontend (`/Front-end/docker-compose.yml`)

Útil para desarrollo de UI con backend disponible.

Comandos:

```bash
cd Front-end
docker compose up -d --build
docker compose ps
docker compose down
```

---

## Endpoints de referencia (stack completo)

- Frontend: http://localhost:8080
- Gateway: http://localhost:8000
- Auth directo: http://localhost:3000
- Storage directo: http://localhost:8001/storage
- Storage vía gateway: http://localhost:8000/api/storage
- MinIO console: http://localhost:9001
- MailHog: http://localhost:8025

Health checks:

- http://localhost:8000/health
- http://localhost:8000/api/auth/health
- http://localhost:8000/api/storage/health
- http://localhost:3000/health

---

## Recomendaciones

- No levantes múltiples compose al tiempo si comparten puertos.
- Usa siempre `docker compose ps` para verificar estado real.
- Si cambias código y no se refleja, reconstruye:

```bash
docker compose up -d --build
```

- Limpieza completa de entorno:

```bash
docker compose down -v
```

---

## Troubleshooting rápido

**Puerto ocupado**

```bash
docker compose down
# Cerrar stacks que estén usando los mismos puertos
```

**Contenedor en crash-loop**

```bash
docker compose logs --tail=100 <service>
docker compose restart <service>
```

**Cambios de imagen/arquitectura**

```bash
docker compose pull <service>
docker compose up -d --force-recreate <service>
```
