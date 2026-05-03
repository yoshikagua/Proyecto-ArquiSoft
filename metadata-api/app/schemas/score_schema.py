import strawberry

@strawberry.type
class CommentType:
    id: str
    usuario: str
    avatar: str
    texto: str
    fecha: str


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
    description: str
    instruments: list[str]
    likes: int
    downloads: int
    favorito: bool
    liked: bool
    comentarios: list[CommentType]