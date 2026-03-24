import strawberry

@strawberry.type
class ScoreType:
    id: str
    title: str
    composer: str
    genre: str
    format: str
    year: int
    uploaded_by: str
    file_url: str