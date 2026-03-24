# KuisiScore – Biblioteca Musical 🎼

Front-end de la aplicación **KuisiScore**, una biblioteca digital de partituras musicales. Desarrollado como parte del proyecto de arquitectura de software del **Grupo 2 – UNAL 2026-I**.

---

## 📋 Descripción del proyecto

KuisiScore permite a usuarios registrados:

- **Explorar** una colección de partituras filtradas por género, instrumento y búsqueda libre.
- **Ver el detalle** de cada partitura: compositor, año, instrumentos, descripción, y descargar el PDF.
- **Interactuar** con las partituras: dar like, agregar a favoritos y dejar comentarios.
- **Subir partituras** nuevas mediante un formulario validado con soporte de arrastrar y soltar (drag & drop) para el PDF.
- **Explorar instrumentos** musicales agrupados por familia/categoría.

---

## 🗂️ Estructura del proyecto

```
Front-end/
├── src/
│   ├── assets/            # Imágenes y recursos estáticos
│   ├── context/
│   │   └── AuthContext.tsx # Contexto global de autenticación (login/logout/user)
│   ├── components/
│   │   ├── Navbar.tsx      # Barra de navegación con avatar y logout
│   │   ├── ProtectedRoute.tsx # Guardia de rutas (redirige a /login si no autenticado)
│   │   ├── ui/             # Componentes shadcn/ui (Button, Input, etc.)
│   │   └── SignUpForm.tsx  # Formulario de registro con validación Zod
│   ├── layouts/
│   │   ├── AuthLayout.tsx  # Layout para páginas de autenticación
│   │   └── MainLayout.tsx  # Layout principal (navbar + footer)
│   ├── pages/
│   │   ├── Login.tsx           # Inicio de sesión (guarda sesión en AuthContext)
│   │   ├── Register.tsx        # Registro de usuario
│   │   ├── RecoverPassword.tsx # Recuperar contraseña
│   │   ├── VerifyCode.tsx      # Verificación de código OTP
│   │   ├── ResetPassword.tsx   # Restablecer contraseña
│   │   ├── Partituras.tsx      # � Lista de partituras (Pública, guest-friendly)
│   │   ├── DetallePartitura.tsx# � Detalle partitura (Lectura pública, acciones protegidas)
│   │   ├── Instrumentos.tsx    # � Lista de instrumentos (Pública)
│   │   └── SubirPartitura.tsx  # 🔒 Formulario para subir partituras (Protegido)
│   ├── mockData.ts        # Datos de ejemplo (reemplazar con llamadas API)
│   ├── types.ts           # Interfaces TypeScript globales
│   └── App.tsx            # Definición de rutas + AuthProvider
├── tailwind.config.ts     # Paleta de colores y tipografía del proyecto
└── index.html
```

> 🔒 = **Ruta protegida**. Requiere sesión activa; redirige a `/login` si no autenticado.
> 🟢 = **Ruta pública**. Accesible como invitado, pero requiere login para interactuar (likes, favoritos, comentarios).

---

## 🎨 Diseño y paleta de colores

| Token        | Hex       | Uso                         |
|--------------|-----------|-----------------------------|
| Primary      | `#8D0B41` | Botones principales, badges |
| Secondary    | `#D39D55` | Acentos dorados, iconos     |
| Background   | `#FFF8E6` | Fondo crema                 |
| Foreground   | `#2D3349` | Texto principal             |

**Tipografías:**
- **Playfair Display** (serif) → Títulos y encabezados
- **Source Sans 3** (sans-serif) → Texto de cuerpo e inputs

---

## 🚀 Cómo correr el proyecto

### Requisitos
- Node.js ≥ 18
- npm ≥ 9

### Instalación y ejecución

```sh
# 1. Ir al directorio del front-end
cd Front-end

# 2. Instalar dependencias
npm install

# 3. Levantar servidor de desarrollo
npm run dev
```

La aplicación quedará disponible en el puerto que asigne Vite (por defecto `http://localhost:8080` en Docker del proyecto).

### Otros comandos útiles

```sh
npm run build       # Construir para producción
npm run preview     # Vista previa del build de producción
npm run lint        # Ejecutar ESLint
npm run test        # Ejecutar pruebas con Vitest
```

---

## 🔗 Rutas disponibles

| Ruta                  | Componente           | Acceso       | Descripción                        |
|-----------------------|----------------------|--------------|---------------------------------|
| `/`                   | Redirect             | Público      | Redirige a `/partituras`           |
| `/login`              | `Login`              | Público      | Iniciar sesión                     |
| `/register`           | `Register`           | Público      | Crear cuenta                       |
| `/recover-password`   | `RecoverPassword`    | Público      | Recuperar contraseña               |
| `/verify-code`        | `VerifyCodePage`     | Público      | Verificar código OTP               |
| `/reset-password`     | `ResetPassword`      | Público      | Restablecer contraseña             |
| `/partituras`         | `Partituras`         | � Público    | Biblioteca de partituras           |
| `/partituras/:id`     | `DetallePartitura`   | � Público    | Detalle de una partitura           |
| `/instrumentos`       | `Instrumentos`       | � Público    | Catálogo de instrumentos           |
| `/subir-partitura`    | `SubirPartitura`     | 🔒 Protegido | Formulario para subir PDF          |

---

## 🔐 Sistema de autenticación

La aplicación implementa autenticación con sesión persistida en `localStorage`:

| Archivo | Función |
|---|---|
| `src/context/AuthContext.tsx` | Provee `user`, `isAuth`, `login()`, `logout()` a toda la app |
| `src/components/ProtectedRoute.tsx` | Redirige a `/login` si `isAuth` es `false` |
| `src/pages/Login.tsx` | Llama `login()` al autenticarse; redirige a la ruta intentada |
| `src/components/Navbar.tsx` | Muestra avatar del usuario y opción de cerrar sesión |

La sesión sobrevive recargas de página (token + datos en `localStorage`).
Al integrar el backend real, solo hay que reemplazar el bloque `TODO` en `Login.tsx`.

---

## 🔌 Integración con backend

Estado actual:

- Login y registro: conectados al backend real vía gateway (`/api/auth/login`, `/api/auth/signup`).
- Health check de auth: disponible vía gateway (`/api/auth/health`).
- Otras vistas (partituras/instrumentos): pueden convivir con secciones mock según módulo.

Guía detallada:

📄 **[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)**

---

## 🛠️ Stack tecnológico

| Herramienta            | Versión  | Uso                              |
|------------------------|----------|----------------------------------|
| React                  | 18       | UI declarativa                   |
| TypeScript             | 5        | Tipado estático                  |
| Vite                   | 5        | Bundler y servidor de desarrollo |
| Tailwind CSS           | 3        | Estilos utilitarios              |
| shadcn/ui              | —        | Componentes accesibles           |
| React Router DOM       | 6        | Enrutamiento SPA                 |
| React Hook Form + Zod  | —        | Formularios y validación         |
| TanStack Query         | 5        | Gestión de estado servidor       |
| Lucide React           | —        | Iconografía                      |
| Sonner                 | —        | Notificaciones toast             |

---

## 👥 Equipo – Grupo 2 ArquiSoft UNAL 2026-I

| Nombre                          | Correo                    |
|---------------------------------|---------------------------|
| Stiven Aguirre Granada          | staguirreg@unal.edu.co    |
| Juan Jose Alvarez Lozano        | jualvarezlo@unal.edu.co   |
| David Andrés Camelo Suárez      | dcamelos@unal.edu.co      |
| Juan Manuel Torres León         | jutorresle@unal.edu.co    |
| Sergio Alejandro Reita Serrano  | sreita@unal.edu.co        |
| Maria Paula Román Arévalo       | maromana@unal.edu.co      |
| David Fernando Benjumea Mora    | dbenjumeam@unal.edu.co    |
| Julian David Rodriguez Fernandez| jrodriguezfe@unal.edu.co  |
| John Jairo Paez Albino          | jopaeza@unal.edu.co       |

