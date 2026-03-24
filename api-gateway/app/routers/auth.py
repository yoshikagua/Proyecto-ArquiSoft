from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import httpx
import json
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
    name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    role_id: int | None = None


class RecoveryRequest(BaseModel):
    email: str


class VerifyRecoveryCodeRequest(BaseModel):
    email: str
    code: str


class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str


class UpdateUserRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    profile_info: str | None = None
    email: str | None = None
    role_id: int | None = None


def _extract_upstream_error_message(response: httpx.Response, fallback: str) -> str:
    try:
        body = response.json()
        if isinstance(body, dict):
            return body.get("message") or body.get("detail") or fallback
        return fallback
    except (json.JSONDecodeError, ValueError):
        text = response.text.strip()
        return text if text else fallback


@router.post("/login")
async def login(request: LoginRequest):
    """
    Proxy para el endpoint de login.
    Redirecciona la solicitud a la API de usuarios.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.user_api_url}/auth/login",
                json=request.model_dump(),
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
        full_name_parts = (request.name or "").strip().split()
        first_name = request.first_name or (full_name_parts[0] if full_name_parts else "User")
        last_name = request.last_name or (
            " ".join(full_name_parts[1:]) if len(full_name_parts) > 1 else "User"
        )

        upstream_payload = {
            "email": request.email,
            "password": request.password,
            "first_name": first_name,
            "last_name": last_name,
            "role_id": request.role_id,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.user_api_url}/auth/register",
                json=upstream_payload,
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


@router.get("/me")
async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.user_api_url}/auth/me",
                headers={"Authorization": auth_header},
                timeout=30.0,
            )

        if response.status_code >= 400:
            raise HTTPException(
                status_code=response.status_code,
                detail=_extract_upstream_error_message(response, "No se pudo obtener el perfil"),
            )

        return response.json()
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Error al conectar con el servicio de autenticación: {str(e)}"
        )


@router.get("/users")
async def get_users(request: Request, limit: int = 50, offset: int = 0):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.user_api_url}/auth/users",
                headers={"Authorization": auth_header},
                params={"limit": limit, "offset": offset},
                timeout=30.0,
            )

        if response.status_code >= 400:
            raise HTTPException(
                status_code=response.status_code,
                detail=_extract_upstream_error_message(response, "No se pudo obtener la lista de usuarios"),
            )

        return response.json()
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Error al conectar con el servicio de autenticación: {str(e)}"
        )


@router.put("/users/{user_id}")
async def update_user(user_id: int, payload: UpdateUserRequest, request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{settings.user_api_url}/auth/users/{user_id}",
                headers={"Authorization": auth_header},
                json=payload.model_dump(exclude_none=True),
                timeout=30.0,
            )

        if response.status_code >= 400:
            raise HTTPException(
                status_code=response.status_code,
                detail=_extract_upstream_error_message(response, "No se pudo actualizar el perfil"),
            )

        if response.status_code == 204:
            return {"message": "Perfil actualizado"}

        return response.json()
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Error al conectar con el servicio de autenticación: {str(e)}"
        )


@router.post("/recover")
async def recover_password(request: RecoveryRequest):
    """
    Proxy para enviar código de recuperación de contraseña.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.user_api_url}/auth/recover",
                json=request.model_dump(),
                timeout=30.0,
            )

        if response.status_code >= 400:
            raise HTTPException(
                status_code=response.status_code,
                detail=_extract_upstream_error_message(
                    response,
                    "No se pudo enviar el código de recuperación",
                ),
            )

        return response.json()

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Error al conectar con el servicio de autenticación: {str(e)}"
        )


@router.post("/verify-recovery-code")
async def verify_recovery_code(request: VerifyRecoveryCodeRequest):
    """
    Proxy para verificar el código de recuperación.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.user_api_url}/auth/verify-recovery-code",
                json=request.model_dump(),
                timeout=30.0,
            )

        if response.status_code >= 400:
            raise HTTPException(
                status_code=response.status_code,
                detail=_extract_upstream_error_message(
                    response,
                    "Código de recuperación inválido",
                ),
            )

        return response.json()

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Error al conectar con el servicio de autenticación: {str(e)}"
        )


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """
    Proxy para restablecer la contraseña con código válido.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.user_api_url}/auth/reset-password",
                json=request.model_dump(),
                timeout=30.0,
            )

        if response.status_code >= 400:
            raise HTTPException(
                status_code=response.status_code,
                detail=_extract_upstream_error_message(
                    response,
                    "No se pudo restablecer la contraseña",
                ),
            )

        return response.json()

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Error al conectar con el servicio de autenticación: {str(e)}"
        )
