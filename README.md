# 🎼 Music Storage - Grupo 2
## Arquitectura de Computadores 2D

Sistema backend para almacenamiento y gestión de partituras musicales utilizando FastAPI + GraphQL + MongoDB + MinIO + Docker.

---

## 👥 Integrantes del grupo

- Stiven Aguirre Granada - staguirreg@unal.edu.co  
- Juan Jose Alvarez Lozano - Jualvarezlo@unal.edu.co  
- David Andrés Camelo Suárez - dcamelos@unal.edu.co  
- Juan Manuel Torres Leon - jutorresle@unal.edu.co  
- Sergio Alejandro Reita Serrano - sreita@unal.edu.co  
- Maria Paula Román Arévalo - maromana@unal.edu.co  
- David Fernando Benjumea Mora - dbenjumeam@unal.edu.co  
- Julian David Rodriguez Fernandez - jrodriguezfe@unal.edu.co  
- John Jairo Paez Albino - jopaeza@unal.edu.co  

---

# 📌 Descripción del Proyecto

Music Storage es una plataforma backend que permite:

- Subir partituras musicales
- Guardar metadatos asociados a cada obra
- Almacenar archivos en MinIO (S3 compatible)
- Registrar información en MongoDB
- Eliminar partituras con control de autorización
- Consultar todas las partituras almacenadas

El sistema utiliza autenticación basada en JWT para proteger las operaciones sensibles.

---

# 🏗️ Arquitectura del Sistema

El sistema está compuesto por los siguientes servicios:

- FastAPI → Servidor backend
- Strawberry GraphQL → API GraphQL
- MongoDB → Base de datos NoSQL
- MinIO → Almacenamiento de archivos compatible con S3
- Docker + Docker Compose → Orquestación de contenedores

### Flujo general

Usuario → GraphQL API →  
- MongoDB (metadatos)  
- MinIO (archivos físicos)

---

# 🎼 Datos almacenados por partitura

Cada partitura contiene:

- 👤 Quién la subió (uploaded_by)
- 🎵 Título
- 🎼 Compositor
- 🎶 Género
- 🎷 Formato (banda sinfónica, banda de rock, orquesta tropical, etc.)
- 📅 Año de la obra
- 📄 Archivo físico almacenado en MinIO

---

# 🚀 Cómo ejecutar el proyecto

## 🔧 Requisitos

- Python 3.10+
- Docker

---

## 🐳 Levantar el sistema

Desde la raíz del proyecto:

```bash
docker-compose up --build
```

O si tu versión usa el nuevo comando:

```bash
docker compose up --build
```

Esto levantará automáticamente:

- MongoDB
- MinIO
- Backend FastAPI

---

## 🛑 Detener el sistema

```bash
docker-compose down
```

Para eliminar también los volúmenes (base de datos incluida):

```bash
docker-compose down -v
```

---

# 🌐 Accesos importantes

## GraphQL Playground

http://localhost:8000/storage

---

## Panel administrativo de MinIO

http://localhost:9001

Credenciales por defecto (según configuración):

Usuario: admin  
Contraseña: password  

---


# 🔐 Seguridad

- Autenticación mediante JWT
- Validación del header Authorization
- Solo el propietario puede eliminar su partitura
- Validación de existencia antes de eliminar
- Eliminación sincronizada en MongoDB y MinIO

---

# 📂 Estructura del Proyecto

```
app/
 ├── core/
 │    ├── config.py
 │    └── storage.py
 │
 ├── db/
 │    └── mongo.py
 │
 ├── graphql/
 │    ├── resolvers.py
 │    └── schema.py
 │
 ├── models/
 │    └── score_model.py
 │
 └── schemas/
      └── score_schema.py
```

---

# 🧠 Decisiones Técnicas

- MinIO en lugar de almacenamiento local para simular entorno productivo.
- MongoDB para flexibilidad en los metadatos.
- GraphQL para consultas dinámicas y estructuradas.
- Docker para portabilidad y facilidad de despliegue.
- Separación por capas (models, schemas, resolvers, core).

---

# 📦 Tecnologías Utilizadas

- FastAPI
- Strawberry GraphQL
- MongoDB
- MinIO
- Docker
- Python
- JWT (python-jose)

---

# 🎯 Estado Actual del Proyecto

✅ Subida autenticada de partituras  
✅ Almacenamiento en MinIO  
✅ Registro de metadatos en MongoDB  
✅ Eliminación autorizada  
✅ API GraphQL funcional  
✅ Contenerización completa con Docker  
