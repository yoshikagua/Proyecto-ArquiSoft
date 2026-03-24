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
    user_id: str
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
        "created_at": datetime.utcnow(),
    }