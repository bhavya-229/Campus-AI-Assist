from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False) # e.g. "MCA201"
    name = Column(String(100), nullable=False) # e.g. "Database Management Systems"
    short_name = Column(String(20), nullable=False) # e.g. "DBMS"
    credits = Column(Integer, default=4)
    instructor = Column(String(100), default="Dr. Sharma")
    department = Column(String(100), default="Computer Applications")
    semester = Column(Integer, default=2)

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    student = relationship("User")
    course = relationship("Course")

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    total_classes = Column(Integer, default=40)
    attended_classes = Column(Integer, default=32)
    percentage = Column(Float, default=80.0)
    last_updated = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    student = relationship("User")
    course = relationship("Course")

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_code = Column(String(20), nullable=False) # e.g. "DBMS"
    course_name = Column(String(100), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(String(50), nullable=False) # e.g. "2026-08-25" or "Friday, Aug 22"
    status = Column(String(20), default="Pending") # "Pending", "Completed", "Submitted"
    priority = Column(String(20), default="Medium") # "High", "Medium", "Low"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User")

class TimetableSlot(Base):
    __tablename__ = "timetable_slots"

    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(String(20), nullable=False) # "Monday", "Tuesday", etc.
    start_time = Column(String(20), nullable=False) # "09:00 AM"
    end_time = Column(String(20), nullable=False) # "10:30 AM"
    course_code = Column(String(20), nullable=False) # "DBMS"
    course_name = Column(String(100), nullable=False) # "Database Management Systems"
    room = Column(String(50), default="Lab 3 / Room 402")
    instructor = Column(String(100), default="Prof. Verma")
    semester = Column(Integer, default=2)
    program = Column(String(50), default="MCA")

class ExamSchedule(Base):
    __tablename__ = "exam_schedules"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(20), nullable=False)
    course_name = Column(String(100), nullable=False)
    exam_date = Column(String(50), nullable=False) # e.g. "2026-08-25"
    time_slot = Column(String(50), default="10:00 AM - 01:00 PM")
    venue = Column(String(100), default="Main Exam Hall - Block B")
    semester = Column(Integer, default=2)
    program = Column(String(50), default="MCA")
