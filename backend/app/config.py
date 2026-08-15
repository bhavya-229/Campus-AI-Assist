from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Campus AI Assist"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "campus_ai_assist_super_secret_jwt_key_for_development"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours

    DATABASE_URL: str = "sqlite:///./campus_ai.db"
    
    QDRANT_PATH: str = "./data/qdrant_storage"
    QDRANT_COLLECTION_NAME: str = "campus_knowledge_base"
    
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_LLM_MODEL: str = "llama3.2:3b"
    OLLAMA_EMBED_MODEL: str = "nomic-embed-text:latest"
    
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
