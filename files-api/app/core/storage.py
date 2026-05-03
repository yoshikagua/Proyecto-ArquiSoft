from minio import Minio
from app.core.config import settings
from io import BytesIO

minio_client = Minio(
    settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ROOT_USER,      
    secret_key=settings.MINIO_ROOT_PASSWORD,  
    secure=False
) #[cite: 3]

def init_bucket():
    if not minio_client.bucket_exists(settings.BUCKET_NAME):
        minio_client.make_bucket(settings.BUCKET_NAME) #[cite: 3]

    # Política para permitir lectura pública de las partituras
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"AWS": ["*"]},
                "Action": ["s3:GetObject"],
                "Resource": [f"arn:aws:s3:::{settings.BUCKET_NAME}/*"]
            }
        ]
    }
    # Es mejor pasar la política como string JSON dinámico
    import json
    minio_client.set_bucket_policy(settings.BUCKET_NAME, json.dumps(policy)) 

# Nueva función de utilidad para la API
def upload_file_to_minio(object_key: str, file_data: bytes, content_type: str):
    return minio_client.put_object(
        settings.BUCKET_NAME,
        object_key,
        BytesIO(file_data),
        length=len(file_data),
        content_type=content_type,
    )
