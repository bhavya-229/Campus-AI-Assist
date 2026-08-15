from pydantic import BaseModel
from typing import List, Optional, Any

class ChatMessage(BaseModel):
    role: str # "user" or "assistant" or "system"
    content: str
    action_result: Optional[dict] = None
    sources: Optional[List[dict]] = None

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

class SourceCitation(BaseModel):
    document_title: str
    source_file: str
    category: str
    page: Optional[int] = None
    snippet: str
    score: float

class ChatResponse(BaseModel):
    reply: str
    intent: str # "academic_rag", "student_attendance", "student_schedule", "student_assignment", "action_created", "general"
    sources: List[SourceCitation] = []
    action_performed: Optional[dict] = None
    student_context: Optional[dict] = None
