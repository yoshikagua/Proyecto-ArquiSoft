#Proyecto-ArquiSoft/api-gateway/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config.settings import settings
from .routers import auth, storage, notifications, payments

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.app_name,
    description="API Gateway para los microservicios del proyecto",
    version="1.0.0",
    debug=settings.debug
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "https://localhost",           # Web frontend vía reverse-proxy (443)
        "https://localhost:4443",      # admin-desktop vía desktop-proxy (4443)
        "http://localhost:8080",       # Web frontend (acceso directo legacy)
        "http://127.0.0.1:8080",
        "http://localhost:1420",       # Tauri desktop (Vite dev)
        "http://127.0.0.1:1420",      # Tauri desktop (Vite dev)
        "tauri://localhost",           # Tauri desktop (producción - protocolo custom)
        "https://tauri.localhost",     # Tauri desktop (producción - HTTPS)
        "http://tauri.localhost",      # Tauri desktop (producción - HTTP, Windows)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers homologados con el prefijo /api
app.include_router(auth.router, prefix="/api")
app.include_router(storage.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(payments.router, prefix="/api")

@app.get("/")
async def root():
    """Endpoint raíz del API Gateway"""
    return {
        "message": "API Gateway funcionando",
        "app": settings.app_name,
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Health check del gateway"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.gateway_port,
        reload=settings.debug
    )
