from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TicketCreate(BaseModel):
    category: str
    subject: str
    description: str
    priority: Optional[str] = "Medium"

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    resolution_notes: Optional[str] = None
    priority: Optional[str] = None

class TicketOut(BaseModel):
    id: int
    ticket_number: str
    student_id: int
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    category: str
    subject: str
    description: str
    priority: str
    status: str
    resolution_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
