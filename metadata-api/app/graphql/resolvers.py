import uuid
import strawberry
import json
from app.core.cache import redis_client
from strawberry.types import Info
from jose import jwt, JWTError
from fastapi import HTTPException
from app.schemas.score_schema import ScoreType, CommentType
from app.db.mongo import get_scores_collection
from app.models.score_model import build_score_document
from app.core.config import settings
from datetime import datetime, timezone
from bson import ObjectId


DEFAULT_GENRES = [
    "Clásico",
    "Barroco",
    "Romántico",
    "Impresionista",
    "Contemporáneo",
    "Jazz",
    "Tradicional",
]

DEFAULT_INSTRUMENTS = [
    "Piano",
    "Violín",
    "Viola",
    "Guitarra",
    "Flauta",
    "Trompeta",
    "Trombón",
    "Tuba",
    "Violonchelo",
    "Saxofón",
    "Clarinete",
    "Oboe",
    "Arpa",
    "Contrabajo",
    "Percusión",
    "Órgano",
]

DEFAULT_FORMATS = [
    "Banda sinfónica",
    "Orquesta tropical",
    "Orquesta de cámara",
    "Coro",
    "Ensamble",
    "Solista",
]


def serialize_docs(docs):
    serialized = []
    for doc in docs:
        comments = [
            {
                "id": str(comment.get("id", "")),
                "usuario": comment.get("usuario", "Usuario"),
                "avatar": comment.get("avatar", "U"),
                "texto": comment.get("texto", ""),
                "fecha": comment.get("fecha", datetime.now(timezone.utc).isoformat()),
            }
            for comment in doc.get("comments", [])
        ]

        doc_copy = {
            "id": str(doc["_id"]),
            "title": doc.get("title", "Sin título"),
            "composer": doc.get("composer", "Desconocido"),
            "genre": doc.get("genre", ""),
            "format": doc.get("format", ""),
            "year": doc.get("year", 0),
            "uploaded_by": str(doc.get("user_id", "")),
            "file_url": f"{settings.MINIO_PUBLIC_URL}/{doc['object_key']}",
            "description": doc.get("description", ""),
            "instruments": doc.get("instruments", []),
            "likes": int(doc.get("likes_count", 0)),
            "downloads": int(doc.get("downloads", 0)),
            "comentarios": comments,
            "liked_by_ids": [str(uid) for uid in doc.get("liked_by", [])],
            "favorited_by_ids": [str(uid) for uid in doc.get("favorited_by", [])],
        }
        serialized.append(doc_copy)
    return serialized


def _parse_user_id_from_request(info: Info, required: bool = False) -> str | None:
    request = info.context["request"]
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        if required:
            raise HTTPException(status_code=401, detail="Authorization header missing")
        return None

    try:
        scheme, token = auth_header.split(maxsplit=1)
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid auth scheme")

        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_sub": False},
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return str(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Malformed authorization header")
    except HTTPException:
        raise
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def _serialize_score(doc: dict, requester_user_id: str | None) -> ScoreType:
    liked_by = [str(user_id) for user_id in doc.get("liked_by", [])]
    favorited_by = [str(user_id) for user_id in doc.get("favorited_by", [])]

    comments = [
        CommentType(
            id=str(comment.get("id", "")),
            usuario=comment.get("usuario", "Usuario"),
            avatar=comment.get("avatar", "U"),
            texto=comment.get("texto", ""),
            fecha=comment.get("fecha", datetime.now(timezone.utc).isoformat()),
        )
        for comment in doc.get("comments", [])
    ]

    return ScoreType(
        id=str(doc["_id"]),
        title=doc.get("title", "Sin título"),
        composer=doc.get("composer", "Desconocido"),
        genre=doc.get("genre", ""),
        format=doc.get("format", ""),
        year=doc.get("year", 0),
        uploaded_by=str(doc.get("user_id", "")),
        file_url=f"{settings.MINIO_PUBLIC_URL}/{doc['object_key']}",
        description=doc.get("description", ""),
        instruments=doc.get("instruments", []),
        likes=int(doc.get("likes_count", 0)),
        downloads=int(doc.get("downloads", 0)),
        favorito=requester_user_id in favorited_by if requester_user_id else False,
        liked=requester_user_id in liked_by if requester_user_id else False,
        comentarios=comments,
    )


async def _get_score_catalog_values() -> tuple[list[str], list[str], list[str]]:
    collection = get_scores_collection()

    genres = await collection.distinct("genre")
    instruments_nested = await collection.distinct("instruments")
    formats = await collection.distinct("format")

    normalized_genres = sorted(
        {
            str(value).strip()
            for value in [*DEFAULT_GENRES, *(genres or [])]
            if isinstance(value, str) and str(value).strip()
        }
    )

    normalized_instruments = sorted(
        {
            str(value).strip()
            for value in [*DEFAULT_INSTRUMENTS, *(instruments_nested or [])]
            if isinstance(value, str) and str(value).strip()
        }
    )

    normalized_formats = sorted(
        {
            str(value).strip()
            for value in [*DEFAULT_FORMATS, *(formats or [])]
            if isinstance(value, str) and str(value).strip()
        }
    )

    return normalized_genres, normalized_instruments, normalized_formats


@strawberry.type
class Query:
    @strawberry.field
    async def scores(self, info: Info) -> list[ScoreType]:
        requester_user_id = _parse_user_id_from_request(info, required=False)

        # 1. Recuperar el catálogo base desde Redis
        cached = await redis_client.get("scores")
        if cached:
            docs = json.loads(cached)
        else:
            collection = get_scores_collection()
            docs = await collection.find().to_list(length=None)
            # Pasamos la función optimizada que formatea la estructura base
            docs = serialize_docs(docs)
            await redis_client.setex("scores", 300, json.dumps(docs))

        # 2. Inyección dinámica ultra veloz (Complejidad O(1) usando sets)
        result = []
        for doc in docs:
            # Convertir listas a Set de Python permite búsquedas instantáneas
            liked_set = set(doc["liked_by_ids"])
            fav_set = set(doc["favorited_by_ids"])

            # Reconstruimos los comentarios al tipo de Strawberry
            comments_obj = [CommentType(**c) for c in doc["comentarios"]]

            # Construimos el ScoreType inyectando únicamente el booleano dinámico por usuario
            score_type = ScoreType(
                id=doc["id"],
                title=doc["title"],
                composer=doc["composer"],
                genre=doc["genre"],
                format=doc["format"],
                year=doc["year"],
                uploaded_by=doc["uploaded_by"],
                file_url=doc["file_url"],
                description=doc["description"],
                instruments=doc["instruments"],
                likes=doc["likes"],
                downloads=doc["downloads"],
                favorito=requester_user_id in fav_set if requester_user_id else False,
                liked=requester_user_id in liked_set if requester_user_id else False,
                comentarios=comments_obj,
            )
            result.append(score_type)

        return result

    @strawberry.field
    async def score_genres(self) -> list[str]:
        cached = await redis_client.get("genres")
        if cached:
            return json.loads(cached)

        genres, _, _ = await _get_score_catalog_values()
        await redis_client.setex("genres", 1800, json.dumps(genres))
        return genres

    @strawberry.field
    async def score_instruments(self) -> list[str]:
        cached = await redis_client.get("instruments")
        if cached:
            return json.loads(cached)

        _, instruments, _ = await _get_score_catalog_values()
        await redis_client.setex("instruments", 1800, json.dumps(instruments))
        return instruments

    @strawberry.field
    async def score_formats(self) -> list[str]:
        cached = await redis_client.get("formats")
        if cached:
            return json.loads(cached)

        _, _, formats = await _get_score_catalog_values()

        await redis_client.setex("formats", 1800, json.dumps(formats))
        return formats


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def upload_score(
        self,
        info: Info,
        title: str,
        composer: str,
        genre: str,
        format_type: str,
        year: int,
        object_key: str,
        file_name: str,
        content_type: str,
        description: str = "",
        instruments: list[str] | None = None,
    ) -> ScoreType:
        user_id = _parse_user_id_from_request(info, required=True)
        collection = get_scores_collection()

        doc = build_score_document(
            title,
            composer,
            genre,
            format_type,
            year,
            file_name,
            content_type,
            object_key,
            user_id=user_id,
            description=description,
            instruments=instruments or [],
        )

        result = await collection.insert_one(doc)
        await redis_client.delete("scores", "genres", "formats", "instruments")
        created_doc = await collection.find_one({"_id": result.inserted_id})

        return _serialize_score(created_doc, user_id)

    @strawberry.mutation
    async def delete_score(self, info: Info, id: str) -> bool:
        user_id = _parse_user_id_from_request(info, required=True)
        collection = get_scores_collection()

        doc = await collection.find_one({"_id": ObjectId(id)})
        if not doc:
            raise Exception("Score not found")

        if doc["user_id"] != user_id:
            raise Exception("Not authorized to delete this score")

        await collection.delete_one({"_id": ObjectId(id)})
        await redis_client.delete("scores", "genres", "formats", "instruments")

        return True

    @strawberry.mutation
    async def update_score(
        self,
        info: Info,
        id: str,
        title: str,
        composer: str,
        genre: str,
        format: str,
        year: int,
        description: str = "",
        instruments: list[str] | None = None,
    ) -> ScoreType:
        user_id = _parse_user_id_from_request(info, required=True)
        collection = get_scores_collection()

        doc = await collection.find_one({"_id": ObjectId(id), "user_id": user_id})
        if not doc:
            raise HTTPException(
                status_code=404, detail="Score not found or not owned by user"
            )

        update_data = {
            "title": title,
            "composer": composer,
            "genre": genre,
            "format": format,
            "year": year,
            "description": description,
            "instruments": instruments or [],
        }
        await collection.update_one({"_id": ObjectId(id)}, {"$set": update_data})
        await redis_client.delete("scores", "genres", "formats", "instruments")

        updated_doc = await collection.find_one({"_id": ObjectId(id)})
        return _serialize_score(updated_doc, user_id)

    @strawberry.mutation
    async def toggle_like(self, info: Info, id: str) -> ScoreType:
        user_id = _parse_user_id_from_request(info, required=True)
        collection = get_scores_collection()

        doc = await collection.find_one({"_id": ObjectId(id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Score not found")

        liked_by = [str(uid) for uid in doc.get("liked_by", [])]
        if user_id in liked_by:
            update = {
                "$pull": {"liked_by": user_id},
                "$inc": {"likes_count": -1},
            }
        else:
            update = {
                "$addToSet": {"liked_by": user_id},
                "$inc": {"likes_count": 1},
            }

        await collection.update_one({"_id": ObjectId(id)}, update)
        await redis_client.delete("scores")

        updated_doc = await collection.find_one({"_id": ObjectId(id)})

        if int(updated_doc.get("likes_count", 0)) < 0:
            await collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": {"likes_count": 0}},
            )
            updated_doc = await collection.find_one({"_id": ObjectId(id)})

        return _serialize_score(updated_doc, user_id)

    @strawberry.mutation
    async def toggle_favorite(self, info: Info, id: str) -> ScoreType:
        user_id = _parse_user_id_from_request(info, required=True)
        collection = get_scores_collection()

        doc = await collection.find_one({"_id": ObjectId(id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Score not found")

        favorited_by = [str(uid) for uid in doc.get("favorited_by", [])]
        if user_id in favorited_by:
            await collection.update_one(
                {"_id": ObjectId(id)},
                {"$pull": {"favorited_by": user_id}},
            )
        else:
            await collection.update_one(
                {"_id": ObjectId(id)},
                {"$addToSet": {"favorited_by": user_id}},
            )

        await redis_client.delete("scores")
        updated_doc = await collection.find_one({"_id": ObjectId(id)})
        return _serialize_score(updated_doc, user_id)

    @strawberry.mutation
    async def add_comment(
        self,
        info: Info,
        id: str,
        texto: str,
        usuario: str,
        avatar: str,
    ) -> ScoreType:
        user_id = _parse_user_id_from_request(info, required=True)
        collection = get_scores_collection()

        doc = await collection.find_one({"_id": ObjectId(id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Score not found")

        comment = {
            "id": str(uuid.uuid4()),
            "usuario": usuario,
            "avatar": avatar,
            "texto": texto,
            "fecha": datetime.now(timezone.utc).isoformat(),
        }

        await collection.update_one(
            {"_id": ObjectId(id)},
            {"$push": {"comments": comment}},
        )
        await redis_client.delete("scores")

        updated_doc = await collection.find_one({"_id": ObjectId(id)})
        return _serialize_score(updated_doc, user_id)

    @strawberry.mutation
    async def register_download(self, info: Info, id: str) -> ScoreType:
        requester = _parse_user_id_from_request(info, required=False)
        collection = get_scores_collection()

        doc = await collection.find_one({"_id": ObjectId(id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Score not found")

        await collection.update_one(
            {"_id": ObjectId(id)},
            {"$inc": {"downloads": 1}},
        )
        await redis_client.delete("scores")
        updated_doc = await collection.find_one({"_id": ObjectId(id)})
        return _serialize_score(updated_doc, requester)