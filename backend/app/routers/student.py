from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.academic import Course, Enrollment, Attendance, Assignment, TimetableSlot, ExamSchedule
from app.models.ticket import SupportTicket
from app.schemas.student import (
    CourseOut, AttendanceOut, AssignmentCreate, AssignmentOut,
    TimetableSlotOut, ExamScheduleOut, DashboardSummaryOut
)
from app.utils.auth_deps import get_current_user

router = APIRouter(prefix="/student", tags=["Student Portal"])

@router.get("/dashboard", response_model=DashboardSummaryOut)
def get_dashboard_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Attendance
    attendances = db.query(Attendance).filter(Attendance.student_id == current_user.id).all()
    att_out = []
    total_att = 0
    total_cls = 0
    for a in attendances:
        c = db.query(Course).filter(Course.id == a.course_id).first()
        status_label = "Critical" if a.percentage < 70 else ("Warning" if a.percentage < 75 else "Good")
        att_out.append(AttendanceOut(
            id=a.id,
            course_id=a.course_id,
            course_code=c.code if c else "N/A",
            course_name=c.name if c else "N/A",
            total_classes=a.total_classes,
            attended_classes=a.attended_classes,
            percentage=round(a.percentage, 1),
            status=status_label
        ))
        total_att += a.attended_classes
        total_cls += a.total_classes

    overall_att = round((total_att / total_cls * 100), 1) if total_cls > 0 else 0.0

    # Pending Assignments
    pending_assignments = db.query(Assignment).filter(
        Assignment.student_id == current_user.id,
        Assignment.status == "Pending"
    ).all()

    # Upcoming Exams
    exams = db.query(ExamSchedule).filter(
        ExamSchedule.program == current_user.program,
        ExamSchedule.semester == current_user.semester
    ).all()

    # Today's Classes (e.g. Monday slots)
    today_classes = db.query(TimetableSlot).filter(
        TimetableSlot.program == current_user.program,
        TimetableSlot.semester == current_user.semester,
        TimetableSlot.day_of_week == "Monday"
    ).all()

    # Active Tickets
    active_tickets_count = db.query(SupportTicket).filter(
        SupportTicket.student_id == current_user.id,
        SupportTicket.status.in_(["Open", "In Progress"])
    ).count()

    return {
        "student": {
            "name": current_user.name,
            "student_id": current_user.student_id,
            "program": current_user.program,
            "semester": current_user.semester,
            "department": current_user.department,
            "email": current_user.email
        },
        "overall_attendance": overall_att,
        "attendance_breakdown": att_out,
        "pending_assignments_count": len(pending_assignments),
        "pending_assignments": pending_assignments,
        "upcoming_exams_count": len(exams),
        "upcoming_exams": exams,
        "today_classes": today_classes,
        "active_tickets_count": active_tickets_count
    }

@router.get("/attendance", response_model=List[AttendanceOut])
def get_attendance(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attendances = db.query(Attendance).filter(Attendance.student_id == current_user.id).all()
    results = []
    for a in attendances:
        c = db.query(Course).filter(Course.id == a.course_id).first()
        status_label = "Critical" if a.percentage < 70 else ("Warning" if a.percentage < 75 else "Good")
        results.append(AttendanceOut(
            id=a.id,
            course_id=a.course_id,
            course_code=c.code if c else "N/A",
            course_name=c.name if c else "N/A",
            total_classes=a.total_classes,
            attended_classes=a.attended_classes,
            percentage=round(a.percentage, 1),
            status=status_label
        ))
    return results

@router.get("/assignments", response_model=List[AssignmentOut])
def get_assignments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignments = db.query(Assignment).filter(Assignment.student_id == current_user.id).order_by(Assignment.id.desc()).all()
    return assignments

@router.post("/assignments", response_model=AssignmentOut)
def create_assignment(
    assignment_in: AssignmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assignment = Assignment(
        student_id=current_user.id,
        course_code=assignment_in.course_code,
        course_name=assignment_in.course_name,
        title=assignment_in.title,
        description=assignment_in.description,
        due_date=assignment_in.due_date,
        priority=assignment_in.priority or "Medium",
        status="Pending"
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment

@router.patch("/assignments/{assignment_id}/toggle", response_model=AssignmentOut)
def toggle_assignment_status(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id,
        Assignment.student_id == current_user.id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    assignment.status = "Completed" if assignment.status == "Pending" else "Pending"
    db.commit()
    db.refresh(assignment)
    return assignment

@router.delete("/assignments/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id,
        Assignment.student_id == current_user.id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    db.commit()
    return {"message": "Assignment deleted successfully"}

@router.get("/timetable", response_model=List[TimetableSlotOut])
def get_timetable(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    slots = db.query(TimetableSlot).filter(
        TimetableSlot.program == current_user.program,
        TimetableSlot.semester == current_user.semester
    ).order_by(TimetableSlot.id.asc()).all()
    return slots

@router.get("/exams", response_model=List[ExamScheduleOut])
def get_exam_schedules(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exams = db.query(ExamSchedule).filter(
        ExamSchedule.program == current_user.program,
        ExamSchedule.semester == current_user.semester
    ).order_by(ExamSchedule.exam_date.asc()).all()
    return exams
