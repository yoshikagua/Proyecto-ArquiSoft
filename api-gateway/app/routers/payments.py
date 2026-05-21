from fastapi import APIRouter, Request, HTTPException
import httpx
import logging
from ..config.settings import settings

router = APIRouter(
    prefix="/payments",
    tags=["payments"]
)

logger = logging.getLogger(__name__)

@router.get("/")
async def get_payments_root():
    """Proxy para la raíz del servicio de pagos"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.payments_url}/")
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Error conectando con pagos: {str(e)}")

@router.get("/health")
async def payments_health():
    """Verifica el estado del servicio de pagos"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.payments_url}/")
            if response.status_code == 200:
                return {"status": "healthy", "service": "payments_app", "details": response.json()}
            return {"status": "unhealthy", "code": response.status_code}
    except Exception as e:
        logger.error(f"Error conectando con el servicio de pagos: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Servicio de pagos no disponible: {str(e)}")

@router.post("/")
async def forward_payment(request: Request):
    """Reenvía la petición de pago al microservicio de Node.js"""
    try:
        # Obtener el cuerpo de la petición
        body = await request.json()

        # 1. Generar cabeceras seguras HMAC
        internal_headers = generate_internal_service_headers()
        
        headers = {
            **internal_headers,
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            # Reenviar al microservicio de Node.js en la ruta /payments
            response = await client.post(
                f"{settings.payments_url}/payments",
                json=body,
                headers=headers, # <--- Inyectadas en la red interna de Docker
                timeout=30.0
            )
            
            # Devolver la respuesta tal cual la entrega el microservicio
            return response.json()
            
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="No se pudo establecer conexión con el servicio de pagos")
    except Exception as e:
        logger.error(f"Error procesando pago en el gateway: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
