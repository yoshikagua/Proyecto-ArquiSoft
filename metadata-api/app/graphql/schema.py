import strawberry
from strawberry.fastapi import GraphQLRouter
from fastapi import Request

from app.graphql.resolvers import Query, Mutation


schema = strawberry.Schema(
    query=Query,
    mutation=Mutation
)


async def get_context(request: Request):
    return {"request": request}


graphql_app = GraphQLRouter(
    schema,
    multipart_uploads_enabled=True,
    context_getter=get_context
)