from app.models.user import User
from app.models.academic import Course, Enrollment, Attendance, Assignment, TimetableSlot, ExamSchedule
from app.models.ticket import SupportTicket
from app.models.document import IngestedDocument

__all__ = [
    "User",
    "Course",
    "Enrollment",
    "Attendance",
    "Assignment",
    "TimetableSlot",
    "ExamSchedule",
    "SupportTicket",
    "IngestedDocument",
]
