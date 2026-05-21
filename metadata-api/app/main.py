# Proyecto-ArquiSoft/metadata-api/app/main.py
import hmac
import hashlib
import os
import time
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.graphql.schema import graphql_app
from app.db.seeds import init_database

app = FastAPI(title="Music Score Storage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Secreto compartido definido en las variables de entorno de tu docker-compose
INTERNAL_SECRET = os.getenv("INTERNAL_SERVICE_SECRET", "super-secret-internal-cluster-key-change-me").encode()

@app.middleware("http")
async def verify_gateway_signature(request: Request, call_next):
    # Permitir bypass opcional para health check o documentación
    if request.url.path in ["/health", "/docs", "/openapi.json"]:
        return await call_next(request)
        
    # 1. Extraer cabeceras generadas por el Gateway
    service_name = request.headers.get("X-Service-Name")
    timestamp_str = request.headers.get("X-Service-Timestamp")
    signature_hex = request.headers.get("X-Service-Signature")
    
    if not service_name or not timestamp_str or not signature_hex:
        return Response(content='{"detail": "Falta firma de canal seguro interno"}', status_code=403, media_type="application/json")
        
    # 2. Control estricto de origen
    if service_name != "api-gateway":
        return Response(content='{"detail": "Origen de petición no autorizado"}', status_code=403, media_type="application/json")
        
    # 3. Ventana de tiempo (Anti-Replay Attack) de 15 segundos
    try:
        timestamp = int(timestamp_str)
        current_time = int(time.time())
        if abs(current_time - timestamp) > 15:
            return Response(content='{"detail": "La firma de la petición ha expirado o desincronización de reloj"}', status_code=403, media_type="application/json")
    except ValueError:
        return Response(content='{"detail": "Timestamp inválido"}', status_code=403, media_type="application/json")
        
    # 4. Verificar firma criptográfica
    message = f"{service_name}:{timestamp_str}".encode()
    expected_signature = hmac.new(INTERNAL_SECRET, message, hashlib.sha256).hexdigest()
    
    # Comparación segura en tiempo constante contra ataques de temporización
    if not hmac.compare_digest(expected_signature, signature_hex):
        return Response(content='{"detail": "Firma HMAC inválida"}', status_code=403, media_type="application/json")
        
    return await call_next(request)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "metadata-api"}

@app.on_event("startup")
async def startup():
    await init_database()

app.include_router(graphql_app, prefix="/storage")
