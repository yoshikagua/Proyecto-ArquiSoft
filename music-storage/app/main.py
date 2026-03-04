from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.graphql.schema import graphql_app
from app.core.storage import init_bucket

app = FastAPI(title="Music Score Storage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_bucket()

app.include_router(graphql_app, prefix="/storage")