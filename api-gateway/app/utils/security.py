import hashlib
import hmac
import time
from ..config.settings import settings

def generate_internal_service_headers() -> dict[str, str]:
    """
    Genera cabeceras de identidad basadas en una firma HMAC-SHA256 efímera.
    Esto demuestra a los microservicios internos que la petición proviene 
    auténticamente del API Gateway sin usar librerías externas.
    """
    timestamp = str(int(time.time()))
    service_name = settings.internal_service_name  # "api-gateway"
    
    # El mensaje a firmar combina el origen y el tiempo actual para evitar Replay Attacks
    message = f"{service_name}:{timestamp}".encode("utf-8")
    secret = settings.internal_service_secret.encode("utf-8")
    
    # Generar la firma criptográfica
    signature = hmac.new(secret, message, hashlib.sha256).hexdigest()
    
    return {
        "X-Service-Name": service_name,
        "X-Service-Timestamp": timestamp,
        "X-Service-Signature": signature
    }
