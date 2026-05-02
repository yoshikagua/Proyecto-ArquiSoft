# Proyecto-ArquiSoft/metadata-api/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.graphql.schema import graphql_app
from app.db.seeds import init_database

app = FastAPI(title="Music Score Storage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "metadata-api"}

@app.on_event("startup")
async def startup():
    await init_database()

app.include_router(graphql_app, prefix="/storage")
