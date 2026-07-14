from datetime import datetime

def build_score_document(
    title,
    composer,
    genre,
    format_type,
    year,
    filename,
    content_type,
    object_key,
    user_id: str,
    description: str = "",
    instruments: list[str] | None = None,
):
    return {
        "title": title,
        "composer": composer,
        "genre": genre,
        "format": format_type,
        "year": year,
        "file_name": filename,
        "user_id": user_id,
        "content_type": content_type,
        "object_key": object_key,
        "description": description,
        "instruments": instruments or [],
        "likes_count": 0,
        "downloads": 0,
        "liked_by": [],
        "favorited_by": [],
        "comments": [],
        "created_at": datetime.utcnow(),
    }