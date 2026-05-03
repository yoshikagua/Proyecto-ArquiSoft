# Proyecto-ArquiSoft/files-api/app/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from app.core.storage import init_bucket, minio_client 
from app.core.config import settings
import uuid
import magic  # <--- ESTO ES LO QUE FALTA
from io import BytesIO

app = FastAPI(title="Files Storage Service")

# Solo permitimos PDFs reales
ALLOWED_MIME_TYPES = ["application/pdf"]

@app.on_event("startup")
async def startup():
    init_bucket() 

async def validate_file_content(file: UploadFile):
    # Leer los primeros bytes para detectar la firma real
    header = await file.read(2048)
    await file.seek(0) # Volver al inicio para la subida posterior
    
    # Detectar el tipo MIME real basado en el contenido binario
    mime_type = magic.from_buffer(header, mime=True)
    
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido. El contenido real es '{mime_type}', pero se requiere PDF."
        )
    return mime_type

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # 1. Validar contenido real
    await validate_file_content(file)

    # 2. Leer bytes para MinIO (después del seek(0) de la validación)
    file_bytes = await file.read()
    
    if not file_bytes:
         raise HTTPException(status_code=400, detail="El archivo está vacío")

    file_id = str(uuid.uuid4())
    object_key = f"{file_id}-{file.filename}"

    # 3. Operación con MinIO
    minio_client.put_object(
        settings.BUCKET_NAME,
        object_key,
        BytesIO(file_bytes),
        length=len(file_bytes),
        content_type="application/pdf",
    )
    
    return {
        "object_key": object_key, 
        "file_name": file.filename
    }

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "files-api"}
