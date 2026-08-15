import os
import sys
import asyncio
from sqlalchemy.orm import Session

# Fix windows console unicode encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.academic import Course, Enrollment, Attendance, Assignment, TimetableSlot, ExamSchedule
from app.models.ticket import SupportTicket
from app.models.document import IngestedDocument
from app.utils.auth_deps import get_password_hash
from app.rag.document_processor import DocumentProcessor
from app.rag.qdrant_store import qdrant_store
from app.rag.hybrid_retriever import hybrid_retriever

async def seed_database():
    print("[*] Initializing Database Schema...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Create Users
        student_email = "bhavya@college.edu"
        admin_email = "admin@college.edu"

        student = db.query(User).filter(User.email == student_email).first()
        if not student:
            print("Creating student user Bhavya...")
            student = User(
                student_id="MCA2025-042",
                name="Bhavya",
                email=student_email,
                hashed_password=get_password_hash("password123"),
                role="student",
                program="MCA",
                semester=2,
                department="Computer Applications",
                batch="2025-2027",
                is_active=True
            )
            db.add(student)
            db.commit()
            db.refresh(student)

        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            print("Creating admin user...")
            admin = User(
                student_id="EMP-ADMIN-01",
                name="Dr. K. Sharma (Dean Academics)",
                email=admin_email,
                hashed_password=get_password_hash("admin123"),
                role="admin",
                program="Admin",
                semester=0,
                department="Academic Office",
                is_active=True
            )
            db.add(admin)
            db.commit()

        # 2. Create Courses
        courses_data = [
            {"code": "MCA201", "name": "Database Management Systems", "short_name": "DBMS", "credits": 4, "instructor": "Dr. Sharma"},
            {"code": "MCA202", "name": "Data Structures & Algorithms", "short_name": "DSA", "credits": 4, "instructor": "Prof. Rao"},
            {"code": "MCA203", "name": "Advanced Java Programming", "short_name": "Java", "credits": 3, "instructor": "Dr. Ananya"},
            {"code": "MCA204", "name": "Internet of Things & Embedded Systems", "short_name": "IoT", "credits": 3, "instructor": "Prof. Verma"}
        ]

        created_courses = []
        for c in courses_data:
            course = db.query(Course).filter(Course.code == c["code"]).first()
            if not course:
                course = Course(
                    code=c["code"],
                    name=c["name"],
                    short_name=c["short_name"],
                    credits=c["credits"],
                    instructor=c["instructor"],
                    department="Computer Applications",
                    semester=2
                )
                db.add(course)
                db.commit()
                db.refresh(course)
            created_courses.append(course)

        # 3. Enrollments & Attendance
        att_presets = {
            "DBMS": {"total": 40, "attended": 33, "pct": 82.5},
            "DSA": {"total": 40, "attended": 35, "pct": 87.5},
            "Java": {"total": 36, "attended": 33, "pct": 91.6},
            "IoT": {"total": 36, "attended": 26, "pct": 72.2} # Warning under 75%
        }

        for c in created_courses:
            enr = db.query(Enrollment).filter(Enrollment.student_id == student.id, Enrollment.course_id == c.id).first()
            if not enr:
                db.add(Enrollment(student_id=student.id, course_id=c.id))

            att = db.query(Attendance).filter(Attendance.student_id == student.id, Attendance.course_id == c.id).first()
            preset = att_presets.get(c.short_name, {"total": 30, "attended": 25, "pct": 83.3})
            if not att:
                db.add(Attendance(
                    student_id=student.id,
                    course_id=c.id,
                    total_classes=preset["total"],
                    attended_classes=preset["attended"],
                    percentage=preset["pct"]
                ))
        db.commit()

        # 4. Assignments
        if db.query(Assignment).count() == 0:
            print("Adding sample assignments...")
            db.add_all([
                Assignment(
                    student_id=student.id,
                    course_code="DBMS",
                    course_name="Database Management Systems",
                    title="Normalization & BCNF Case Study",
                    description="Decompose the university database schema into 3NF and BCNF with functional dependency proofs.",
                    due_date="2026-08-22",
                    status="Pending",
                    priority="High"
                ),
                Assignment(
                    student_id=student.id,
                    course_code="Java",
                    course_name="Advanced Java Programming",
                    title="Spring Boot Microservice REST API",
                    description="Implement JWT authentication and CRUD endpoints for student registration service.",
                    due_date="2026-08-25",
                    status="Pending",
                    priority="Medium"
                ),
                Assignment(
                    student_id=student.id,
                    course_code="IoT",
                    course_name="Internet of Things",
                    title="MQTT Sensor Simulation on ESP32",
                    description="Publish temperature telemetry to cloud broker using MQTT protocol.",
                    due_date="2026-08-28",
                    status="Pending",
                    priority="Low"
                ),
                Assignment(
                    student_id=student.id,
                    course_code="DSA",
                    course_name="Data Structures & Algorithms",
                    title="Graph Algorithms & Dijkstra Implementation",
                    description="Shortest path benchmark analysis in C++/Java.",
                    due_date="2026-08-10",
                    status="Completed",
                    priority="Medium"
                )
            ])
            db.commit()

        # 5. Timetable Slots
        if db.query(TimetableSlot).count() == 0:
            print("Adding timetable schedule...")
            timetable_data = [
                # Monday
                {"day": "Monday", "start": "09:00 AM", "end": "10:30 AM", "code": "DBMS", "name": "Database Management Systems", "room": "Hall 201", "inst": "Dr. Sharma"},
                {"day": "Monday", "start": "10:45 AM", "end": "12:15 PM", "code": "DSA", "name": "Data Structures & Algorithms", "room": "Hall 201", "inst": "Prof. Rao"},
                {"day": "Monday", "start": "01:30 PM", "end": "04:30 PM", "code": "DBMS Lab", "name": "DBMS Practical Lab", "room": "Lab 3", "inst": "Dr. Sharma"},
                # Tuesday
                {"day": "Tuesday", "start": "09:00 AM", "end": "10:30 AM", "code": "Java", "name": "Advanced Java Programming", "room": "Hall 202", "inst": "Dr. Ananya"},
                {"day": "Tuesday", "start": "10:45 AM", "end": "12:15 PM", "code": "IoT", "name": "Internet of Things", "room": "Lab 1", "inst": "Prof. Verma"},
                # Wednesday
                {"day": "Wednesday", "start": "09:00 AM", "end": "10:30 AM", "code": "DSA", "name": "Data Structures & Algorithms", "room": "Hall 201", "inst": "Prof. Rao"},
                {"day": "Wednesday", "start": "10:45 AM", "end": "12:15 PM", "code": "DBMS", "name": "Database Management Systems", "room": "Hall 201", "inst": "Dr. Sharma"},
                {"day": "Wednesday", "start": "01:30 PM", "end": "04:30 PM", "code": "Java Lab", "name": "Java Programming Lab", "room": "Lab 4", "inst": "Dr. Ananya"},
                # Thursday
                {"day": "Thursday", "start": "09:00 AM", "end": "10:30 AM", "code": "IoT", "name": "Internet of Things", "room": "Hall 202", "inst": "Prof. Verma"},
                {"day": "Thursday", "start": "10:45 AM", "end": "12:15 PM", "code": "Java", "name": "Advanced Java Programming", "room": "Hall 202", "inst": "Dr. Ananya"},
                # Friday
                {"day": "Friday", "start": "09:00 AM", "end": "11:00 AM", "code": "Project", "name": "Minor Project Review", "room": "Seminar Hall", "inst": "Faculty Committee"},
                {"day": "Friday", "start": "11:15 AM", "end": "12:45 PM", "code": "DSA", "name": "DSA Tutorial & Problem Solving", "room": "Hall 201", "inst": "Prof. Rao"},
            ]
            for t in timetable_data:
                db.add(TimetableSlot(
                    day_of_week=t["day"],
                    start_time=t["start"],
                    end_time=t["end"],
                    course_code=t["code"],
                    course_name=t["name"],
                    room=t["room"],
                    instructor=t["inst"],
                    semester=2,
                    program="MCA"
                ))
            db.commit()

        # 6. Exam Schedules
        if db.query(ExamSchedule).count() == 0:
            print("Adding exam schedules...")
            db.add_all([
                ExamSchedule(
                    course_code="MCA201",
                    course_name="Database Management Systems",
                    exam_date="2026-09-02",
                    time_slot="10:00 AM - 01:00 PM",
                    venue="Main Examination Hall - Block A",
                    semester=2,
                    program="MCA"
                ),
                ExamSchedule(
                    course_code="MCA202",
                    course_name="Data Structures & Algorithms",
                    exam_date="2026-09-05",
                    time_slot="10:00 AM - 01:00 PM",
                    venue="Main Examination Hall - Block A",
                    semester=2,
                    program="MCA"
                ),
                ExamSchedule(
                    course_code="MCA203",
                    course_name="Advanced Java Programming",
                    exam_date="2026-09-08",
                    time_slot="10:00 AM - 01:00 PM",
                    venue="Main Examination Hall - Block A",
                    semester=2,
                    program="MCA"
                ),
                ExamSchedule(
                    course_code="MCA204",
                    course_name="Internet of Things & Embedded Systems",
                    exam_date="2026-09-11",
                    time_slot="10:00 AM - 01:00 PM",
                    venue="Main Examination Hall - Block A",
                    semester=2,
                    program="MCA"
                )
            ])
            db.commit()

        # 7. Sample Support Tickets
        if db.query(SupportTicket).count() == 0:
            print("Adding sample support tickets...")
            db.add_all([
                SupportTicket(
                    ticket_number="TICK-1024",
                    student_id=student.id,
                    category="ID card",
                    subject="Smart card RFID chip not detected at Library gate",
                    description="My ID card RFID is not being recognized at the library entrance scanner since yesterday.",
                    priority="Medium",
                    status="In Progress",
                    resolution_notes="Ticket assigned to IT RFID administrator. Card barcode verified."
                ),
                SupportTicket(
                    ticket_number="TICK-1019",
                    student_id=student.id,
                    category="IT support",
                    subject="Campus Wi-Fi high-speed login reset",
                    description="Requested MAC address registration for secondary laptop.",
                    priority="Low",
                    status="Resolved",
                    resolution_notes="Device MAC address whitelisted for Campus_Student_HighSpeed SSID."
                )
            ])
            db.commit()

        # 8. Ingest Knowledge Base Documents into Qdrant & BM25
        sample_docs_dir = "./sample_docs"
        if os.path.exists(sample_docs_dir):
            print("[*] Indexing College Knowledge Base Documents into Qdrant Vector Store...")
            for fname in os.listdir(sample_docs_dir):
                file_path = os.path.join(sample_docs_dir, fname)
                if not os.path.isfile(file_path):
                    continue

                doc_title = fname.replace("_", " ").replace(".txt", "").replace(".pdf", "")
                cat = "General Regulations"
                if "Syllabus" in fname or "Curriculum" in fname:
                    cat = "Curriculum & Syllabus"
                elif "Exam" in fname:
                    cat = "Examinations"
                elif "Facilities" in fname or "Hostel" in fname:
                    cat = "Campus Services"

                # Check if already in DB
                existing = db.query(IngestedDocument).filter(IngestedDocument.filename == fname).first()
                if not existing:
                    pages = DocumentProcessor.extract_text_from_file(file_path)
                    chunks = DocumentProcessor.chunk_documents(pages)
                    if chunks:
                        indexed = await qdrant_store.add_documents(chunks, category=cat, doc_title=doc_title)
                        doc_rec = IngestedDocument(
                            filename=fname,
                            title=doc_title,
                            category=cat,
                            file_type=os.path.splitext(fname)[1].replace(".", ""),
                            total_chunks=indexed,
                            file_size_bytes=os.path.getsize(file_path),
                            description=f"College policy document: {doc_title}"
                        )
                        db.add(doc_rec)
                        db.commit()
                        print(f"  + Indexed '{doc_title}' ({indexed} chunks)")

            hybrid_retriever.sync_bm25_from_qdrant()

        print("[+] Database seeding and Knowledge Base Indexing Complete!")

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
