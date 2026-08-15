from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), unique=True, index=True, nullable=True) # e.g. "MCA2025-042"
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="student") # "student" or "admin"
    program = Column(String(50), default="MCA") # MCA, B.Tech, MBA etc.
    semester = Column(Integer, default=2)
    department = Column(String(100), default="Computer Applications")
    batch = Column(String(20), default="2025-2027")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
