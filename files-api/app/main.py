# Proyecto-ArquiSoft/files-api/app/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from app.core.storage import init_bucket, minio_client 
from app.core.config import settings
import uuid
import magic 
import hashlib
from io import BytesIO
from minio.error import S3Error

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
    await validate_file_content(file)
    file_bytes = await file.read()
    
    if not file_bytes:
         raise HTTPException(status_code=400, detail="El archivo está vacío")

    # 1. Generar Hash SHA-256
    file_hash = hashlib.sha256(file_bytes).hexdigest()
    
    # 2. Definir una estructura de nombre basada SOLO en el hash para evitar duplicidad física
    # Opcional: Puedes guardar el nombre original solo en la base de datos de metadatos
    object_key = f"{file_hash}.pdf" 

    # 3. LÓGICA DE DEDUPLICACIÓN: Verificar si ya existe en MinIO
    try:
        minio_client.stat_object(settings.BUCKET_NAME, object_key)
        # Si no lanza error, el archivo YA EXISTE
        return {
            "message": "El archivo ya existe en el servidor",
            "object_key": object_key,
            "file_hash": file_hash,
            "status": "skipped"
        }
    except S3Error:
        # Si lanza S3Error es porque NO existe, procedemos a subir
        pass

    # 4. Operación con MinIO (solo si no existe)
    minio_client.put_object(
        settings.BUCKET_NAME,
        object_key,
        BytesIO(file_bytes),
        length=len(file_bytes),
        content_type="application/pdf",
        metadata={"file-hash": file_hash}
    )
    
    return {
        "object_key": object_key, 
        "file_name": file.filename,
        "file_hash": file_hash,
        "status": "uploaded"
    }
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "files-api"}

@app.delete("/delete/{object_key}")
async def delete_file(object_key: str):
    try:
        # Verificar si el objeto existe antes de intentar borrar
        minio_client.stat_object(settings.BUCKET_NAME, object_key)
        
        # Eliminar el objeto
        minio_client.remove_object(settings.BUCKET_NAME, object_key)
        
        return {"status": "success", "message": f"Archivo {object_key} eliminado de MinIO"}
    except S3Error as e:
        if e.code == "NoSuchKey":
            raise HTTPException(status_code=404, detail="El archivo no existe en MinIO")
        raise HTTPException(status_code=500, detail=str(e))
