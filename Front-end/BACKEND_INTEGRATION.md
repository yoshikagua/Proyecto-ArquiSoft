# 🔌 Guía de integración con el Backend – KuisiScore

Este documento explica **cómo conectar cada página del front-end** con los endpoints REST del backend cuando estén disponibles. Actualmente el proyecto usa datos de ejemplo ubicados en `src/mockData.ts`.

---

## Índice

1. [Configuración base](#1-configuración-base)
2. [Autenticación](#2-autenticación)
3. [Partituras](#3-partituras)
4. [Instrumentos](#4-instrumentos)
5. [Subir una partitura](#5-subir-una-partitura)
6. [Detalle de partitura (likes, favoritos, comentarios)](#6-detalle-de-partitura)
7. [Manejo de errores](#7-manejo-de-errores)
8. [Autenticación con JWT (token en cada petición)](#8-autenticación-con-jwt)

---

## 1. Configuración base

Crea un archivo `src/api/client.ts` con la URL base del backend y una configuración de Axios (o `fetch` nativo):

```ts
// src/api/client.ts
import axios from "axios";

/**
 * Cliente Axios preconfigurado con la URL base del backend.
 * Ajusta VITE_API_URL en tu .env según el ambiente.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: añade el token JWT en cada petición autenticada
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

En el archivo `.env` (o `.env.local`) del proyecto:

```env
VITE_API_URL=http://localhost:8080/api
```

> ⚠️ **Nunca subas el archivo `.env` con credenciales reales al repositorio.**

---

## 2. Autenticación

### Endpoints esperados

| Método | Ruta                        | Descripción                    |
|--------|-----------------------------|--------------------------------|
| POST   | `/auth/login`               | Iniciar sesión                 |
| POST   | `/auth/register`            | Registrar usuario              |
| POST   | `/auth/recover-password`    | Enviar correo de recuperación  |
| POST   | `/auth/verify-code`         | Verificar código OTP           |
| POST   | `/auth/reset-password`      | Restablecer contraseña         |

### Ejemplo – Login (`src/pages/Login.tsx`)

```ts
// ANTES (mock):
const handleSubmit = (e) => {
  e.preventDefault();
  setError("Correo o contraseña incorrectos.");
};

// DESPUÉS (API real):
import { apiClient } from "@/api/client";

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const { data } = await apiClient.post("/auth/login", { email, password });
    // Guardar el token JWT recibido
    localStorage.setItem("access_token", data.access_token);
    navigate("/partituras");
  } catch (err) {
    setError("Correo o contraseña incorrectos. Inténtalo de nuevo.");
  }
};
```

> El token devuelto (`data.access_token`) se almacena en `localStorage` y el interceptor del cliente lo añade automáticamente a todas las peticiones siguientes.

---

## 3. Partituras

### Endpoints esperados

| Método | Ruta                    | Descripción                              |
|--------|-------------------------|------------------------------------------|
| GET    | `/partituras`           | Obtener lista de partituras (con filtros)|
| GET    | `/partituras/:id`       | Obtener una partitura por ID             |

**Parámetros de query sugeridos para `GET /partituras`:**

| Parámetro     | Tipo   | Ejemplo              |
|---------------|--------|----------------------|
| `q`           | string | `?q=beethoven`       |
| `genero`      | string | `?genero=Clásico`    |
| `instrumento` | string | `?instrumento=Piano` |

### Cambios en `src/pages/Partituras.tsx`

```ts
// ANTES – datos del mock:
import { PARTITURAS_MOCK } from "@/mockData";
const partiturasFiltradas = useMemo(() => { /* lógica local */ }, [...]);

// DESPUÉS – TanStack Query con la API:
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Partitura } from "@/types";

const { data: partituras = [], isLoading, isError } = useQuery<Partitura[]>({
  queryKey: ["partituras", busqueda, generoActivo, instrumentoFiltro],
  queryFn: async () => {
    const params = new URLSearchParams();
    if (busqueda)          params.set("q", busqueda);
    if (generoActivo !== "Todos") params.set("genero", generoActivo);
    if (instrumentoFiltro) params.set("instrumento", instrumentoFiltro);
    const { data } = await apiClient.get(`/partituras?${params}`);
    return data;
  },
});
```

> Si la API devuelve una estructura anidada como `{ data: [...], total: N }`, ajusta el `queryFn` según el contrato real.

---

## 4. Instrumentos

### Endpoints esperados

| Método | Ruta             | Descripción                               |
|--------|------------------|-------------------------------------------|
| GET    | `/instrumentos`  | Obtener lista de instrumentos (con filtro)|

**Parámetros de query sugeridos:**

| Parámetro   | Ejemplo                    |
|-------------|----------------------------|
| `q`         | `?q=violín`                |
| `categoria` | `?categoria=Cuerda`        |

### Cambios en `src/pages/Instrumentos.tsx`

```ts
// ANTES:
import { INSTRUMENTOS_MOCK } from "@/mockData";

// DESPUÉS:
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Instrumento } from "@/types";

const { data: instrumentos = [], isLoading } = useQuery<Instrumento[]>({
  queryKey: ["instrumentos", busqueda, categoriaActiva],
  queryFn: async () => {
    const params = new URLSearchParams();
    if (busqueda)                    params.set("q", busqueda);
    if (categoriaActiva !== "Todas") params.set("categoria", categoriaActiva);
    const { data } = await apiClient.get(`/instrumentos?${params}`);
    return data;
  },
});
```

---

## 5. Subir una partitura

### Endpoint esperado

| Método | Ruta          | Content-Type          | Descripción              |
|--------|---------------|-----------------------|--------------------------|
| POST   | `/partituras` | `multipart/form-data` | Crear nueva partitura    |

### Cambios en `src/pages/SubirPartitura.tsx`

```ts
// ANTES – simulación de carga:
await new Promise((r) => setTimeout(r, 2000));

// DESPUÉS – envío real como multipart:
import { apiClient } from "@/api/client";

const onSubmit = async (data: SubirPartituraData) => {
  if (!archivoSeleccionado) return;

  const formData = new FormData();
  formData.append("titulo",       data.titulo);
  formData.append("autor",        data.autor);
  formData.append("anio",         String(data.anio));
  formData.append("genero",       data.genero);
  formData.append("descripcion",  data.descripcion ?? "");
  formData.append("instrumentos", JSON.stringify(instrumentosSeleccionados));
  formData.append("archivo",      archivoSeleccionado); // el PDF

  setEnviando(true);
  try {
    await apiClient.post("/partituras", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success("¡Partitura subida exitosamente!");
    navigate("/partituras");
  } catch (err) {
    toast.error("Error al subir la partitura. Inténtalo de nuevo.");
  } finally {
    setEnviando(false);
  }
};
```

---

## 6. Detalle de partitura

### Endpoints esperados

| Método | Ruta                             | Descripción                     |
|--------|----------------------------------|---------------------------------|
| GET    | `/partituras/:id`                | Obtener datos de la partitura   |
| GET    | `/partituras/:id/pdf`            | Descargar el archivo PDF        |
| POST   | `/partituras/:id/likes`          | Dar like a una partitura        |
| DELETE | `/partituras/:id/likes`          | Quitar like                     |
| POST   | `/partituras/:id/favoritos`      | Añadir a favoritos              |
| DELETE | `/partituras/:id/favoritos`      | Quitar de favoritos             |
| GET    | `/partituras/:id/comentarios`    | Obtener comentarios             |
| POST   | `/partituras/:id/comentarios`    | Publicar un comentario          |

### Cambios en `src/pages/DetallePartitura.tsx`

```ts
// ANTES:
const partituraBase = PARTITURAS_MOCK.find((p) => p.id === id);

// DESPUÉS – carga dinámica:
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

const queryClient = useQueryClient();

// Datos de la partitura
const { data: partitura, isLoading } = useQuery({
  queryKey: ["partitura", id],
  queryFn: async () => {
    const { data } = await apiClient.get(`/partituras/${id}`);
    return data;
  },
  enabled: !!id,
});

// Descarga real del PDF
const handleDescargar = async () => {
  const response = await apiClient.get(`/partituras/${id}/pdf`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${partitura?.titulo ?? "partitura"}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

// Like
const likeMutation = useMutation({
  mutationFn: () =>
    liked
      ? apiClient.delete(`/partituras/${id}/likes`)
      : apiClient.post(`/partituras/${id}/likes`),
  onSuccess: () => {
    setLiked(!liked);
    setLikes((n) => liked ? n - 1 : n + 1);
  },
});

// Comentario
const comentarioMutation = useMutation({
  mutationFn: (texto: string) =>
    apiClient.post(`/partituras/${id}/comentarios`, { texto }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["partitura", id] });
    setNuevoComentario("");
  },
});
```

---

## 7. Manejo de errores

### Estado de carga y error globales

```tsx
// En cualquier página con useQuery:
const { data, isLoading, isError, error } = useQuery({ ... });

if (isLoading) {
  return (
    <MainLayout>
      <div className="flex justify-center items-center py-40">
        <svg className="h-8 w-8 animate-spin text-secondary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    </MainLayout>
  );
}

if (isError) {
  return (
    <MainLayout>
      <p className="text-center py-20 text-destructive">
        Error al cargar los datos. Por favor recarga la página.
      </p>
    </MainLayout>
  );
}
```

### Códigos HTTP relevantes

| Código | Significado                        | Acción sugerida                        |
|--------|------------------------------------|----------------------------------------|
| 400    | Solicitud inválida                 | Mostrar mensajes de validación         |
| 401    | No autenticado                     | Redirigir a `/login`                   |
| 403    | Sin permisos                       | Mostrar alerta de acceso denegado      |
| 404    | Recurso no encontrado              | Mostrar estado vacío                   |
| 413    | Archivo demasiado grande           | Informar límite de tamaño              |
| 500    | Error interno del servidor         | Toast de error genérico                |

---

## 8. Autenticación con JWT

### Interceptor de respuesta (manejo de token expirado)

Agrega este interceptor al archivo `src/api/client.ts`:

```ts
// Interceptor de respuesta: redirige al login si el token expira
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

### Rutas protegidas

Cuando el backend esté listo, crea un componente `ProtectedRoute` para asegurarte de que solo usuarios autenticados accedan a `/partituras`, `/instrumentos` y `/subir-partitura`:

```tsx
// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem("access_token");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
```

Úsalo en `App.tsx`:

```tsx
<Route
  path="/partituras"
  element={<ProtectedRoute><Partituras /></ProtectedRoute>}
/>
```

---

## Checklist de integración

- [ ] Crear `src/api/client.ts` con `axios` y la URL base del backend
- [ ] Añadir `VITE_API_URL` al archivo `.env`
- [ ] Reemplazar `PARTITURAS_MOCK` en `Partituras.tsx` con `useQuery`
- [ ] Reemplazar `INSTRUMENTOS_MOCK` en `Instrumentos.tsx` con `useQuery`
- [ ] Actualizar `onSubmit` en `SubirPartitura.tsx` para enviar `multipart/form-data`
- [ ] Actualizar `DetallePartitura.tsx` con fetch real + mutaciones de likes/favoritos/comentarios
- [ ] Implementar descarga de PDF desde el endpoint `/partituras/:id/pdf`
- [ ] Completar flujo de login/register con almacenamiento real del token JWT
- [ ] Agregar `ProtectedRoute` para rutas autenticadas
- [ ] Eliminar `src/mockData.ts` cuando toda la integración esté completada
