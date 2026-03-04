import strawberry

@strawberry.type
class ScoreType:
    id: str
    title: str
    composer: str
    file_url: str