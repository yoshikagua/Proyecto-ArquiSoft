from minio import Minio
from app.core.config import settings

minio_client = Minio(
    settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ROOT_USER,      
    secret_key=settings.MINIO_ROOT_PASSWORD,  
    secure=False
)

def init_bucket():
    if not minio_client.bucket_exists(settings.BUCKET_NAME):
        minio_client.make_bucket(settings.BUCKET_NAME)

    minio_client.set_bucket_policy(
        settings.BUCKET_NAME,
        """
        {
          "Version":"2012-10-17",
          "Statement":[
            {
              "Effect":"Allow",
              "Principal":{"AWS":["*"]},
              "Action":["s3:GetObject"],
              "Resource":["arn:aws:s3:::scores/*"]
            }
          ]
        }
        """
    )