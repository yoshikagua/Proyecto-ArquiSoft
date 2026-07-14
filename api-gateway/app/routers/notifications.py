from fastapi import APIRouter, HTTPException, Request
import httpx
from ..config.settings import settings
# Importar el helper para firmar las peticiones del canal seguro
from ..utils.security import generate_internal_service_headers 

router = APIRouter(
    prefix="/api/notifications",
    tags=["notifications"],
    responses={404: {"description": "Not found"}},
)

@router.post("/send")
async def send_notification(request: Request):
    """
    Proxy para enviar notificaciones por email.
    Redirecciona la solicitud al microservicio de notificaciones.
    """
    try:
        body = await request.json()
        
        # Generar las cabeceras de firma HMAC-SHA256
        internal_headers = generate_internal_service_headers()
        headers = {
            **internal_headers,
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.notification_url}",
                json=body,
                headers=headers,  #  Inyectar firmas en la cabecera
                timeout=30.0
            )
        
        if response.status_code >= 400:
            raise HTTPException(
                status_code=response.status_code,
                detail=response.json().get("error", "Error en el servicio de notificaciones")
            )
        
        return response.json()
    
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Error al conectar con el servicio de notificaciones: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en la petición: {str(e)}")

@router.get("/health")
async def health_check():
    """Verificar estado del servicio de notificaciones"""
    try:
        #  Firmar también el Health Check si el microservicio PHP requiere validación global
        headers = generate_internal_service_headers()

        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.notification_url}/status",
                headers=headers  #  Adjuntar firmas
            )
            status = "online" if response.status_code == 200 else f"offline_{response.status_code}"
    except Exception:
        status = "unreachable"

    return {
        "status": "ok",
        "notification_service": status,
        "notification_url": settings.notification_url
    }
