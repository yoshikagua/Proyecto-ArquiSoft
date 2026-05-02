from fastapi import APIRouter, HTTPException, Request, Response, UploadFile, File, Form
import httpx
import json
from ..config.settings import settings

router = APIRouter(
    prefix="/api/storage",
    tags=["storage"],
    responses={404: {"description": "Not found"}},
)

HOP_BY_HOP_HEADERS = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailers", "transfer-encoding", "upgrade", "content-length",
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
        async with httpx.AsyncClient(timeout=10.0) as client:
            # URLs internas de la red de Docker basadas en tus logs exitosos
            meta_res = await client.get("http://metadata-api:8000/health")
            files_res = await client.get("http://files-api:8000/health")
            
        return {
            "status": "ok",
            "metadata_api": "online" if meta_res.status_code == 200 else f"offline_{meta_res.status_code}",
            "files_api": "online" if files_res.status_code == 200 else f"offline_{files_res.status_code}"
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Error de conectividad: {str(e)}")

@router.post("/upload-score")
async def orchestrate_upload(
    request: Request,
    title: str = Form(...),
    composer: str = Form(...),
    genre: str = Form(...),
    format_type: str = Form(...),
    year: int = Form(...),
    description: str = Form(""),
    instruments: str = Form("[]"),
    file: UploadFile = File(...)
):
    auth_header = request.headers.get("Authorization")
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        # --- PASO 1: Subida a Files-API ---
        try:
            file_content = await file.read()
            files_res = await client.post(
                "http://files-api:8000/upload",
                files={"file": (file.filename, file_content, file.content_type)}
            )
            
            # Validación crítica para evitar el 'NoneType' error
            if files_res.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Files-API rechazó la subida: {files_res.text}")
            
            file_info = files_res.json()
            if not file_info or "object_key" not in file_info:
                raise HTTPException(status_code=502, detail="Files-API no devolvió la información del archivo")

        except Exception as e:
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=500, detail=f"Fallo en la comunicación con Files-API: {str(e)}")

        # --- PASO 2: Registro en Metadata-API ---
        mutation = {
            "query": """
                mutation RegisterScore($title: String!, $composer: String!, $genre: String!, 
                                     $formatType: String!, $year: Int!, $objectKey: String!, 
                                     $fileName: String!, $contentType: String!, 
                                     $description: String!, $instruments: [String!]!) {
                    uploadScore(
                        title: $title, composer: $composer, genre: $genre, 
                        formatType: $formatType, year: $year, objectKey: $objectKey, 
                        fileName: $fileName, contentType: $contentType, 
                        description: $description, instruments: $instruments
                    ) {
                        id
                        title
                    }
                }
            """,
            "variables": {
                "title": title,
                "composer": composer,
                "genre": genre,
                "formatType": format_type,
                "year": year,
                "objectKey": file_info["object_key"],
                "fileName": file_info["file_name"],
                "contentType": file.content_type,
                "description": description,
                "instruments": json.loads(instruments)
            }
        }

        try:
            headers = {"Content-Type": "application/json"}
            if auth_header:
                headers["Authorization"] = auth_header

            # Cambiado settings.music_storage_url por la URL directa de metadatos
            metadata_res = await client.post(
                "http://metadata-api:8000/storage",
                json=mutation,
                headers=headers
            )
            
            return metadata_res.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al registrar metadatos: {str(e)}")

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_music_storage(request: Request, path: str = "") -> Response:
    # Apuntamos a la URL interna del contenedor
    upstream_url = f"http://metadata-api:8000/storage"
    if path:
        upstream_url = f"{upstream_url}/{path}"

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            upstream_response = await client.request(
                method=request.method,
                url=upstream_url,
                params=request.query_params,
                content=await request.body(),
                headers={k: v for k, v in request.headers.items() if k.lower() != "host"},
            )
        
        return Response(
            content=upstream_response.content,
            status_code=upstream_response.status_code,
            headers=_filter_response_headers(upstream_response.headers),
            media_type=upstream_response.headers.get("content-type"),
        )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"Error en el proxy: {str(exc)}")
