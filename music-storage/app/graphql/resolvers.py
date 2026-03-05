import uuid
import strawberry
from strawberry.file_uploads import Upload
from strawberry.types import Info
from jose import jwt, JWTError
from fastapi import HTTPException
from app.schemas.score_schema import ScoreType
from app.db.mongo import get_scores_collection
from app.models.score_model import build_score_document
from app.core.storage import minio_client
from app.core.config import settings
from io import BytesIO
from datetime import timedelta
from bson import ObjectId

@strawberry.type
class Query:

    @strawberry.field
    async def scores(self) -> list[ScoreType]:
        collection = get_scores_collection()
        docs = await collection.find().to_list(100)

        return [
            ScoreType(
                id=str(doc["_id"]),
                title=doc.get("title", "Sin título"),
                composer=doc.get("composer", "Desconocido"),
                genre=doc.get("genre", ""),        
                format=doc.get("format", ""),      
                year=doc.get("year", 0),           
                uploaded_by=doc.get("user_id", ""),
                file_url=f"http://localhost:9000/{settings.BUCKET_NAME}/{doc['object_key']}",
            )
            for doc in docs
        ]


@strawberry.type
class Mutation:

    @strawberry.mutation
    async def upload_score(
        self,
        info: Info,  # 👈 IMPORTANTE
        title: str,
        composer: str,
        genre: str,
        format_type: str,
        year: int,
        file: Upload
    ) -> ScoreType:

        # 🔐 1️⃣ Leer header Authorization
        request = info.context["request"]
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            raise HTTPException(status_code=401, detail="Authorization header missing")

        try:
            scheme, token = auth_header.split()

            if scheme.lower() != "bearer":
                raise HTTPException(status_code=401, detail="Invalid auth scheme")

            # 🔐 2️⃣ Validar JWT
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM]
            )

            user_id = payload.get("sub")

            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token payload")

        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

        
        collection = get_scores_collection()

        file_id = str(uuid.uuid4())
        object_key = f"{file_id}-{file.filename}"

        file_bytes = await file.read()

        minio_client.put_object(
            settings.BUCKET_NAME,
            object_key,
            BytesIO(file_bytes),
            length=len(file_bytes),
            content_type=file.content_type,
        )

        
        doc = build_score_document(
            title,
            composer,
            genre,
            format_type,
            year,
            file.filename,
            file.content_type,
            object_key,
            user_id=user_id
        )

        result = await collection.insert_one(doc)

        return ScoreType(
            id=str(result.inserted_id),
            title=title,
            composer=composer,
            genre=genre,
            format=format_type,
            year=year,
            uploaded_by=user_id,
            file_url=f"http://localhost:9000/{settings.BUCKET_NAME}/{object_key}",
        )
    
    @strawberry.mutation
    async def delete_score(self, info: Info, id: str) -> bool:

        # 🔐 1️⃣ Leer header Authorization
        request = info.context["request"]
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            raise HTTPException(status_code=401, detail="Authorization header missing")

        try:
            scheme, token = auth_header.split()

            if scheme.lower() != "bearer":
                raise HTTPException(status_code=401, detail="Invalid auth scheme")

            # 🔐 2️⃣ Validar JWT
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM]
            )

            user_id = payload.get("sub")

            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token payload")

        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

        # 📦 3️⃣ Buscar documento en Mongo
        collection = get_scores_collection()

        doc = await collection.find_one({"_id": ObjectId(id)})

        if not doc:
            raise Exception("Score not found")

        # 🔒 4️⃣ Validar que sea el dueño
        if doc["user_id"] != user_id:
            raise Exception("Not authorized to delete this score")

        # 🗑 5️⃣ Eliminar archivo de MinIO
        minio_client.remove_object(
            settings.BUCKET_NAME,
            doc["object_key"]
        )

        # 🗄 6️⃣ Eliminar documento en Mongo
        await collection.delete_one({"_id": ObjectId(id)})

        return True