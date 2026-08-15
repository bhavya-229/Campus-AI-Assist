from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class CourseOut(BaseModel):
    id: int
    code: str
    name: str
    short_name: str
    credits: int
    instructor: str
    department: str
    semester: int

    class Config:
        from_attributes = True

class AttendanceOut(BaseModel):
    id: int
    course_id: int
    course_code: str
    course_name: str
    total_classes: int
    attended_classes: int
    percentage: float
    status: str # "Good", "Warning", "Critical"

class AssignmentBase(BaseModel):
    course_code: str
    course_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    due_date: str
    priority: Optional[str] = "Medium"

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentOut(AssignmentBase):
    id: int
    student_id: int
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TimetableSlotOut(BaseModel):
    id: int
    day_of_week: str
    start_time: str
    end_time: str
    course_code: str
    course_name: str
    room: str
    instructor: str

    class Config:
        from_attributes = True

class ExamScheduleOut(BaseModel):
    id: int
    course_code: str
    course_name: str
    exam_date: str
    time_slot: str
    venue: str

    class Config:
        from_attributes = True

class DashboardSummaryOut(BaseModel):
    student: dict
    overall_attendance: float
    attendance_breakdown: List[AttendanceOut]
    pending_assignments_count: int
    pending_assignments: List[AssignmentOut]
    upcoming_exams_count: int
    upcoming_exams: List[ExamScheduleOut]
    today_classes: List[TimetableSlotOut]
    active_tickets_count: int
