from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config.settings import settings
from .routers import auth, storage

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
    allow_origins=["*"],  # En producción, especificar los orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(storage.router)


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
