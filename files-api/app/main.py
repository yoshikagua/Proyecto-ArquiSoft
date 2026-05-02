# Proyecto-ArquiSoft/files-api/app/main.py
from fastapi import FastAPI, UploadFile, File
from app.core.storage import init_bucket, minio_client # cite: 3
from app.core.config import settings
import uuid
from io import BytesIO

app = FastAPI(title="Files Storage Service")

@app.on_event("startup")
async def startup():
    init_bucket() 

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Generamos los identificadores
    file_id = str(uuid.uuid4())
    object_key = f"{file_id}-{file.filename}"
    file_bytes = await file.read()

    # Operación con MinIO
    minio_client.put_object(
        settings.BUCKET_NAME,
        object_key,
        BytesIO(file_bytes),
        length=len(file_bytes),
        content_type=file.content_type,
    )
    
    # IMPORTANTE: Este return debe existir y estar indentado correctamente
    return {
        "object_key": object_key, 
        "file_name": file.filename
    }
    
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "files-api"} #
    
    return {"object_key": object_key, "file_name": file.filename}
