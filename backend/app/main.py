from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, student, tickets, chat, admin
from app.rag.hybrid_retriever import hybrid_retriever
import os

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Context-Aware Student Support & Academic Assistant Platform powered by Hybrid RAG (Qdrant + BM25) and Local LLM (Llama 3.2:3b)",
    version="1.0.0"
)

# CORS configuration with explicit dev origins
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(student.router, prefix=settings.API_V1_STR)
app.include_router(tickets.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    # Sync BM25 from Qdrant vector store
    try:
        hybrid_retriever.sync_bm25_from_qdrant()
    except Exception as e:
        print(f"BM25 startup sync notice: {e}")

@app.get("/")
def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": "1.0.0",
        "vector_db": "Qdrant",
        "retrieval": "Hybrid (Dense Vector + BM25)",
        "local_llm": settings.OLLAMA_LLM_MODEL
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
