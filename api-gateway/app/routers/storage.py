from fastapi import APIRouter, HTTPException, Request, Response, UploadFile, File, Form
import httpx
import json
from ..config.settings import settings
# IMPORTAR HELPER DE SEGURIDAD INTERNA
from ..utils.security import generate_internal_service_headers

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
    """Filtra cabeceras hop-by-hop para evitar conflictos en el proxy."""
    return {
        key: value
        for key, value in headers.items()
        if key.lower() not in HOP_BY_HOP_HEADERS
    }

@router.get("/health")
async def storage_health() -> dict[str, str]:
    """Verifica la conectividad con los microservicios internos."""
    try:
        # Generar cabeceras internas para el chequeo de salud
        internal_headers = generate_internal_service_headers()
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            meta_res = await client.get("http://metadata-api:8000/health", headers=internal_headers)
            files_res = await client.get("http://files-api:8000/health", headers=internal_headers)
            
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
    """Orquesta la subida de archivos y el registro de metadatos."""
    auth_header = request.headers.get("Authorization")
    
    # Generar firmas para los canales internos
    internal_headers = generate_internal_service_headers()
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        # --- PASO 1: Subida a Files-API ---
        try:
            file_content = await file.read()
            # Anexamos las firmas HMAC a la petición multipart de archivos
            files_res = await client.post(
                "http://files-api:8000/upload",
                files={"file": (file.filename, file_content, file.content_type)},
                headers=internal_headers
            )
            
            if files_res.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Files-API rechazó la subida: {files_res.text}")
            
            file_info = files_res.json()

            # Lógica de Deduplicación
            if file_info.get("status") == "skipped":
                return {
                    "data": {
                        "uploadScore": {
                            "id": "existing_" + file_info["file_hash"][:8],
                            "title": f"{title} (Ya existente)"
                        }
                    }
                }

        except Exception as e:
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=500, detail=f"Fallo en Files-API: {str(e)}")

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
                    ) { id title }
                }
            """,
            "variables": {
                "title": title,
                "composer": composer,
                "genre": genre,
                "formatType": format_type,
                "year": year,
                "objectKey": file_info["object_key"],
                "fileName": file_info.get("file_name", file.filename),
                "contentType": file.content_type,
                "description": description,
                "instruments": json.loads(instruments)
            }
        }

        # Combinar Content-Type, firmas HMAC internas y token de usuario externo si existe
        headers = {
            "Content-Type": "application/json",
            **internal_headers
        }
        if auth_header:
            headers["Authorization"] = auth_header

        metadata_res = await client.post("http://metadata-api:8000/storage", json=mutation, headers=headers)
        return metadata_res.json()

@router.delete("/remove/{score_id}")
async def orchestrate_delete_score(score_id: str, request: Request):
    """Elimina el registro de la DB y el archivo físico de forma coordinada."""
    auth_header = request.headers.get("Authorization")
    internal_headers = generate_internal_service_headers()
    
    headers = {**internal_headers}
    if auth_header:
        headers["Authorization"] = auth_header
    
    async with httpx.AsyncClient(timeout=20.0) as client:
        # PASO 1: Obtener la URL para extraer el object_key
        query = {"query": "{ scores { id fileUrl } }"}
        meta_check = await client.post(
            "http://metadata-api:8000/storage",
            json=query,
            headers=headers
        )
        
        data = meta_check.json()
        if "errors" in data:
            raise HTTPException(status_code=400, detail=data["errors"][0]["message"])

        scores_data = data.get("data", {}).get("scores", [])
        target_score = next((s for s in scores_data if s["id"] == score_id), None)
        
        if not target_score:
            raise HTTPException(status_code=404, detail="Partitura no encontrada")
            
        object_key = target_score["fileUrl"].split("/")[-1]

        # PASO 2: Borrar en Metadata-API (MongoDB)
        delete_payload = {
            "query": """
                mutation Resborrar($id: String!) {
                    deleteScore(id: $id)
                }
            """,
            "variables": {"id": score_id}
        }
        
        meta_res = await client.post(
            "http://metadata-api:8000/storage",
            json=delete_payload,
            headers=headers
        )
        meta_data = meta_res.json()
        
        if "errors" in meta_data:
            error_detail = meta_data['errors'][0]['message']
            raise HTTPException(
                status_code=500, 
                detail=f"Error en Metadata-API: {error_detail}"
            )

        # PASO 3: Borrar archivo físico en Files-API
        try:
            await client.delete(f"http://files-api:8000/delete/{object_key}", headers=internal_headers)
        except Exception:
            return {"status": "partial_success", "message": "DB limpia, pero el archivo físico persistió"}
        
        return {"status": "success", "message": "Registro y archivo eliminados correctamente"}

# --- SOLUCIÓN AL ERROR 404 DE GRAPHQL ---

@router.get("")  # Maneja /api/storage
@router.get("/") # Maneja /api/storage/
async def handle_graphql_root_get(request: Request):
    """Túnel directo para abrir GraphiQL desde el navegador en el gateway."""
    client_headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}
    internal_headers = generate_internal_service_headers()
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.request(
            method="GET",
            url="http://metadata-api:8000/storage",
            params=request.query_params,
            headers={**client_headers, **internal_headers},
        )
    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=_filter_response_headers(response.headers),
        media_type=response.headers.get("content-type"),
    )


@router.head("")  # Maneja /api/storage en verificaciones HEAD
@router.head("/") # Maneja /api/storage/ en verificaciones HEAD
async def handle_graphql_root_head(request: Request):
    """Expone los mismos headers que GET sin incluir body."""
    client_headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}
    internal_headers = generate_internal_service_headers()
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.request(
            method="GET",
            url="http://metadata-api:8000/storage",
            params=request.query_params,
            headers={**client_headers, **internal_headers},
        )
    return Response(
        content=b"",
        status_code=response.status_code,
        headers=_filter_response_headers(response.headers),
        media_type=response.headers.get("content-type"),
    )

@router.post("")  # Maneja /api/storage
@router.post("/") # Maneja /api/storage/
async def handle_graphql_root(request: Request):
    """Túnel directo para peticiones GraphQL desde el frontend."""
    client_headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}
    internal_headers = generate_internal_service_headers()
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.request(
            method="POST",
            url="http://metadata-api:8000/storage",
            content=await request.body(),
            headers={**client_headers, **internal_headers},
        )
    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=_filter_response_headers(response.headers),
        media_type=response.headers.get("content-type"),
    )

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_music_storage(request: Request, path: str = "") -> Response:
    """Proxy genérico para rutas adicionales."""
    upstream_url = f"http://metadata-api:8000/storage/{path}" if path else "http://metadata-api:8000/storage"
    
    client_headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}
    internal_headers = generate_internal_service_headers()

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            upstream_response = await client.request(
                method=request.method,
                url=upstream_url,
                params=request.query_params,
                content=await request.body(),
                headers={**client_headers, **internal_headers},
            )
        
        return Response(
            content=upstream_response.content,
            status_code=upstream_response.status_code,
            headers=_filter_response_headers(upstream_response.headers),
            media_type=upstream_response.headers.get("content-type"),
        )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"Error en el proxy: {str(exc)}")
