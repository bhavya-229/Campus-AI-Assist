from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DocumentOut(BaseModel):
    id: int
    filename: str
    title: str
    category: str
    file_type: str
    total_chunks: int
    file_size_bytes: int
    description: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DocumentIndexResponse(BaseModel):
    message: str
    document: DocumentOut
    indexed_chunks: int
