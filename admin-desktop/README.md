# KuisiScore Admin Desktop

Aplicación de escritorio para la administración de la plataforma KuisiScore. Permite a los administradores gestionar usuarios, roles y contenido desde una interfaz nativa de escritorio.

Construida con [Tauri](https://tauri.app) + React + TypeScript.

---

## Prerrequisitos

Antes de correr el proyecto debes instalar las siguientes herramientas según tu sistema operativo.

### 1. Node.js >= 20

Descarga desde https://nodejs.org o usa un gestor de versiones (recomendado):

```bash
# Instalar nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reiniciar terminal o ejecutar:
export NVM_DIR="$HOME/.nvm" && \. "$NVM_DIR/nvm.sh"

# Instalar y usar Node 20
nvm install 20
nvm use 20
```

Verifica:
```bash
node --version   # debe mostrar v20.x.x o superior
npm --version
```

> **Importante:** Vite requiere Node.js 20+. Node 18 no funciona con este proyecto.

---

### 2. Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
```

Verifica:
```bash
rustc --version
cargo --version
```

---

### 3. Dependencias del sistema

#### Linux (Ubuntu / Debian)

```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf \
  pkg-config \
  libssl-dev \
  build-essential
```

#### macOS

```bash
xcode-select --install
```

#### Windows

1. Instalar [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
   - En el instalador seleccionar: **"Desktop development with C++"**
2. WebView2 ya viene incluido en Windows 10 (versión 1803+) y Windows 11. Si no está, descargarlo desde [aka.ms/webview2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

---

## Backend requerido

La app se conecta al API Gateway a través de un **proxy inverso dedicado** (`desktop-proxy`) con canal seguro TLS, completamente separado del proxy del frontend web. Todos los servicios deben estar corriendo antes de abrir la app.

```bash
# Desde la raíz del proyecto (donde está el docker-compose.yml)
docker compose up
```

### Arquitectura de conexión

```
[admin-desktop]  →  https://localhost:4443  →  [desktop-proxy (nginx TLS)]  →  [api-gateway]
```

El `desktop-proxy` escucha exclusivamente en el puerto **4443** con HTTPS (TLS 1.2/1.3) y enruta únicamente las peticiones del panel de administración hacia el API Gateway. Es independiente del proxy del frontend web (puerto 443).

---

## Paso único: confiar en el certificado TLS (por máquina)

Dado que el canal seguro usa un certificado autofirmado, Windows debe registrarlo como confiable **una sola vez por equipo**. Sin este paso, WebView2 (el motor interno de Tauri) rechazará las conexiones HTTPS al proxy.

**Paso 1 — Generar el certificado** (solo si no existe o hay que renovarlo).  
Desde la raíz del proyecto con Docker corriendo:

```bash
docker run --rm -v "%CD%\certs:/certs" alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/gateway.key -out /certs/gateway.crt -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
```

**Paso 2 — Importar el certificado en Windows** (una sola vez por equipo).  
Abre **PowerShell como Administrador**, navega a la raíz del proyecto y ejecuta:

```powershell
Import-Certificate -FilePath "certs\gateway.crt" -CertStoreLocation "Cert:\LocalMachine\Root"
```

Si aparece un `Thumbprint` con un hash largo, fue exitoso.

**Paso 3 — Reiniciar los proxies** para que nginx tome el nuevo certificado:

```bash
docker compose restart reverse-proxy desktop-proxy
```

> Una vez importado, cualquier build del `.exe` funcionará en esa máquina sin repetir estos pasos.

---

## Acceso

Solo pueden ingresar usuarios con rol **admin** o **superadmin**. Usuarios con rol `user` son rechazados en el login aunque sus credenciales sean correctas.

Las cuentas de administrador se crean desde el backend directamente o asignando el rol correspondiente desde el Panel Admin dentro de la misma app (requiere estar logueado como superadmin).

---

## Instalación

```bash
# Clonar el repositorio y entrar a la carpeta
git clone <url-del-repo>
cd admin-desktop

# Instalar dependencias de Node
npm install
```

---

## Desarrollo

#### Linux / WSL2

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 20
source "$HOME/.cargo/env"
npm run tauri dev
```

#### macOS / Windows

```bash
npm run tauri dev
```

Esto abre la ventana de escritorio con hot-reload. La primera vez tarda varios minutos porque Rust compila las dependencias desde cero. Las siguientes veces es mucho más rápido.

Para detenerla: cierra la ventana con la X o presiona `Ctrl + C` en la terminal.

> **Nota en WSL2:** Requiere WSLg (incluido en Windows 11) para mostrar la ventana. Si la ventana no aparece, verifica que `echo $DISPLAY` retorne `:0`.

---

## Build (producción)

```bash
npm run tauri build
```

Genera los instaladores en `src-tauri/target/release/bundle/`:

| OS | Archivo generado |
|----|-----------------|
| Linux | `.deb`, `.rpm`, `.AppImage` |
| macOS | `.dmg`, `.app` |
| Windows | `.msi`, `.exe` |

---

## Estructura del proyecto

```
admin-desktop/
├── src/
│   ├── components/
│   │   └── Navbar.tsx
│   ├── context/
│   │   ├── AuthContext.tsx       # Autenticación global
│   │   └── PartiturasContext.tsx # Estado de partituras
│   ├── layouts/
│   │   ├── AuthLayout.tsx        # Layout para login
│   │   └── MainLayout.tsx        # Layout con navbar
│   ├── lib/
│   │   └── apiClient.ts          # Cliente HTTP → API Gateway
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Partituras.tsx        # Biblioteca con filtros
│   │   ├── DetallePartitura.tsx  # Vista individual + comentarios
│   │   ├── Instrumentos.tsx      # Explorador por familia
│   │   ├── SubirPartitura.tsx    # Formulario de upload
│   │   └── Perfil.tsx            # Perfil + panel de administración
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/                    # Backend nativo Rust (Tauri)
│   └── tauri.conf.json
├── public/
├── index.html
├── package.json
└── vite.config.ts
```

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| UI | React 19 + TypeScript |
| Estilos | Tailwind CSS |
| Formularios | React Hook Form + Zod |
| Build | Vite |
| Desktop runtime | Tauri 2 |
| Backend nativo | Rust |
| API | REST + GraphQL → desktop-proxy (TLS) → API Gateway |
| Proxy | nginx (canal seguro TLS en `localhost:4443`) |

---

## Solución de problemas

**Error: `webkit2gtk not found`**
→ Instalar las dependencias de Linux listadas arriba.

**Error: `rustc not found`**
→ Rust no está en el PATH. Ejecutar `source "$HOME/.cargo/env"` o reiniciar la terminal.

**La ventana no abre en WSL2**
→ Instalar WSLg (Windows 11) o un servidor X, y configurar `export DISPLAY=:0`.

**La primera compilación tarda mucho**
→ Es normal. Rust compila todas las dependencias desde cero la primera vez (~3-5 min). Las siguientes compilaciones son incrementales y mucho más rápidas.
