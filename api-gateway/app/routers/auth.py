from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from ..config.settings import settings

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
    responses={404: {"description": "Not found"}},
)


class LoginRequest(BaseModel):
    email: str
    password: str


class SignUpRequest(BaseModel):
    email: str
    password: str
    name: str


@router.post("/login")
async def login(request: LoginRequest):
    """
    Proxy para el endpoint de login.
    Redirecciona la solicitud a la API de usuarios.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.user_api_url}/api/auth/login",
                json=request.dict(),
                timeout=30.0
            )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Error en la autenticación"
            )
        
        return response.json()
    
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Error al conectar con el servicio de autenticación: {str(e)}"
        )


@router.post("/signup")
async def signup(request: SignUpRequest):
    """
    Proxy para el endpoint de registro.
    Redirecciona la solicitud a la API de usuarios.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.user_api_url}/api/auth/signup",
                json=request.dict(),
                timeout=30.0
            )
        
        if response.status_code not in [200, 201]:
            raise HTTPException(
                status_code=response.status_code,
                detail="Error al registrar usuario"
            )
        
        return response.json()
    
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Error al conectar con el servicio de autenticación: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Verificar estado de los servicios"""
    return {
        "status": "ok",
        "user_api": settings.user_api_url,
        "frontend": settings.frontend_url
    }
