from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base

class IngestedDocument(Base):
    __tablename__ = "ingested_documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="General Regulations")
    file_type = Column(String(20), default="pdf") # pdf, txt, md
    total_chunks = Column(Integer, default=0)
    file_size_bytes = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
