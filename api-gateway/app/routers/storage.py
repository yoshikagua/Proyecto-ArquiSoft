from fastapi import APIRouter, HTTPException, Request, Response
import httpx

from ..config.settings import settings


router = APIRouter(
    prefix="/api/storage",
    tags=["storage"],
    responses={404: {"description": "Not found"}},
)

HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "content-length",
}


def _filter_response_headers(headers: httpx.Headers) -> dict[str, str]:
    return {
        key: value
        for key, value in headers.items()
        if key.lower() not in HOP_BY_HOP_HEADERS
    }


@router.get("/health")
async def storage_health() -> dict[str, str]:
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(settings.music_storage_url)
        if response.status_code >= 500:
            raise HTTPException(status_code=503, detail="Music Storage no disponible")
        return {
            "status": "ok",
            "music_storage": settings.music_storage_url,
        }
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Error al conectar con music-storage: {str(exc)}",
        )


@router.api_route("", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_music_storage(request: Request, path: str = "") -> Response:
    upstream_url = settings.music_storage_url
    if path:
        upstream_url = f"{upstream_url}/{path}"

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            upstream_response = await client.request(
                method=request.method,
                url=upstream_url,
                params=request.query_params,
                content=await request.body(),
                headers={
                    key: value
                    for key, value in request.headers.items()
                    if key.lower() != "host"
                },
            )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Error al conectar con music-storage: {str(exc)}",
        )

    response_headers = _filter_response_headers(upstream_response.headers)
    content_type = upstream_response.headers.get("content-type")

    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=response_headers,
        media_type=content_type,
    )
