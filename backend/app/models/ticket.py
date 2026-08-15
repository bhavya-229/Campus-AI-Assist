from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(20), unique=True, index=True, nullable=False) # e.g. "TICK-1024"
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(50), nullable=False) # "ID card", "Examination", "IT support", "Library", "Hostel", "Fees", "Classroom", "Administration"
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), default="Medium") # "Low", "Medium", "High", "Urgent"
    status = Column(String(20), default="Open") # "Open", "In Progress", "Resolved", "Closed"
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student = relationship("User")
