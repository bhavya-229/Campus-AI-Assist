import re
import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.academic import Course, Enrollment, Attendance, Assignment, TimetableSlot, ExamSchedule
from app.models.ticket import SupportTicket
from app.rag.hybrid_retriever import hybrid_retriever
from app.rag.llm_client import llm_client

logger = logging.getLogger(__name__)

class ContextEngine:
    @staticmethod
    def get_student_context(student: User, db: Session) -> Dict[str, Any]:
        """
        Builds live structured context of the student from database.
        """
        # Enrollments
        enrollments = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
        courses = []
        for e in enrollments:
            c = db.query(Course).filter(Course.id == e.course_id).first()
            if c:
                courses.append({
                    "id": c.id,
                    "code": c.code,
                    "name": c.name,
                    "short_name": c.short_name,
                    "instructor": c.instructor
                })

        # Attendance
        attendances = db.query(Attendance).filter(Attendance.student_id == student.id).all()
        attendance_list = []
        for att in attendances:
            c = db.query(Course).filter(Course.id == att.course_id).first()
            if c:
                attendance_list.append({
                    "course_code": c.code,
                    "course_name": c.name,
                    "short_name": c.short_name,
                    "total_classes": att.total_classes,
                    "attended_classes": att.attended_classes,
                    "percentage": att.percentage,
                    "warning": att.percentage < 75.0
                })

        # Assignments (Pending)
        assignments = db.query(Assignment).filter(
            Assignment.student_id == student.id,
            Assignment.status == "Pending"
        ).all()
        pending_assignments = [{
            "id": a.id,
            "course": a.course_code,
            "title": a.title,
            "due_date": a.due_date,
            "priority": a.priority
        } for a in assignments]

        # Timetable slots
        timetable = db.query(TimetableSlot).filter(
            TimetableSlot.program == student.program,
            TimetableSlot.semester == student.semester
        ).all()
        timetable_data = [{
            "day": t.day_of_week,
            "time": f"{t.start_time} - {t.end_time}",
            "course": t.course_code,
            "course_name": t.course_name,
            "room": t.room
        } for t in timetable]

        # Exams
        exams = db.query(ExamSchedule).filter(
            ExamSchedule.program == student.program,
            ExamSchedule.semester == student.semester
        ).all()
        exam_data = [{
            "course": e.course_code,
            "course_name": e.course_name,
            "date": e.exam_date,
            "time": e.time_slot,
            "venue": e.venue
        } for e in exams]

        return {
            "name": student.name,
            "student_id": student.student_id,
            "email": student.email,
            "program": student.program,
            "semester": student.semester,
            "department": student.department,
            "enrolled_courses": courses,
            "attendance": attendance_list,
            "pending_assignments": pending_assignments,
            "timetable": timetable_data,
            "exams": exam_data
        }

    @staticmethod
    async def process_user_query(
        user_message: str,
        student: User,
        db: Session,
        history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Main contextual reasoning and Hybrid RAG router.
        """
        context = ContextEngine.get_student_context(student, db)
        lower_msg = user_message.lower().strip()

        # ----------------------------------------------------
        # 1. Action Intent: Add Assignment
        # E.g. "Add DBMS assignment due Friday", "Add assignment for Java: Collections due Aug 24"
        # ----------------------------------------------------
        if any(keyword in lower_msg for keyword in ["add assignment", "create assignment", "new assignment", "add an assignment"]):
            return await ContextEngine._handle_add_assignment_action(user_message, student, db, context)

        # ----------------------------------------------------
        # 2. Action Intent: Mark Assignment Completed
        # E.g. "Mark my DBMS assignment as completed", "Complete assignment 2"
        # ----------------------------------------------------
        if any(keyword in lower_msg for keyword in ["mark", "complete"]) and "assignment" in lower_msg:
            return await ContextEngine._handle_complete_assignment_action(user_message, student, db, context)

        # ----------------------------------------------------
        # 3. Action Intent: Create Support Ticket
        # E.g. "Create ticket: ID card not working", "My ID card is lost, create support request"
        # ----------------------------------------------------
        if any(keyword in lower_msg for keyword in ["create ticket", "raise ticket", "support request", "new ticket", "raise a ticket", "file ticket"]):
            return await ContextEngine._handle_create_ticket_action(user_message, student, db, context)

        # ----------------------------------------------------
        # 4. Student DB Direct Queries: Attendance
        # E.g. "What's my attendance?", "Show my attendance in DBMS"
        # ----------------------------------------------------
        if "attendance" in lower_msg and any(w in lower_msg for w in ["my", "what's", "whats", "show", "check", "how much", "percentage"]):
            return ContextEngine._handle_student_attendance_query(user_message, context)

        # ----------------------------------------------------
        # 5. Student DB Direct Queries: Timetable / Classes
        # E.g. "What do I have tomorrow?", "Show my timetable", "What classes today?"
        # ----------------------------------------------------
        if any(keyword in lower_msg for keyword in ["timetable", "schedule", "classes today", "classes tomorrow", "what do i have", "my lectures"]):
            return ContextEngine._handle_student_schedule_query(user_message, context)

        # ----------------------------------------------------
        # 6. Student DB Direct Queries: Pending Assignments
        # E.g. "What assignments do I have?", "Show my pending assignments"
        # ----------------------------------------------------
        if "assignment" in lower_msg and any(w in lower_msg for w in ["pending", "my", "what", "show", "list", "due"]):
            return ContextEngine._handle_student_assignments_query(context)

        # ----------------------------------------------------
        # 7. Student DB Direct Queries: Upcoming Exams
        # E.g. "When are my exams?", "Show exam schedule"
        # ----------------------------------------------------
        if any(keyword in lower_msg for keyword in ["my exam", "my exams", "exam schedule", "exam dates", "when is my exam"]):
            return ContextEngine._handle_student_exams_query(context)

        # ----------------------------------------------------
        # 8. Hybrid RAG Academic & Campus Knowledge Search
        # ----------------------------------------------------
        return await ContextEngine._handle_hybrid_rag_query(user_message, student, context, history)

    # --------------------------------------------------------
    # Action and Query Handlers
    # --------------------------------------------------------

    @staticmethod
    async def _handle_add_assignment_action(message: str, student: User, db: Session, context: Dict[str, Any]) -> Dict[str, Any]:
        # Extract course, title, and due date
        # Fallback to smart parsing
        matched_course = "General"
        for c in context["enrolled_courses"]:
            if c["short_name"].lower() in message.lower() or c["name"].lower() in message.lower():
                matched_course = c["short_name"]
                break

        # Extract due date if mentioned (e.g. "due Friday", "due 2026-08-25", "due Aug 24")
        due_match = re.search(r'due\s+([A-Za-z0-9\s,\-]+)', message, re.IGNORECASE)
        due_date = due_match.group(1).strip() if due_match else "Upcoming Friday"

        title_cleaned = re.sub(r'(add|create|new)\s+(an\s+)?assignment\s*(for\s+)?', '', message, flags=re.IGNORECASE)
        title_cleaned = re.sub(r'due\s+([A-Za-z0-9\s,\-]+)', '', title_cleaned, flags=re.IGNORECASE).strip(" :-")
        if not title_cleaned or len(title_cleaned) < 3:
            title_cleaned = f"{matched_course} Task Submission"

        new_assignment = Assignment(
            student_id=student.id,
            course_code=matched_course,
            title=title_cleaned,
            description=f"Added via Campus AI Assistant: {message}",
            due_date=due_date,
            status="Pending",
            priority="Medium"
        )
        db.add(new_assignment)
        db.commit()
        db.refresh(new_assignment)

        reply = (
            f"✅ **Assignment Added Successfully!**\n\n"
            f"- **Subject:** {matched_course}\n"
            f"- **Title:** {title_cleaned}\n"
            f"- **Due Date:** {due_date}\n"
            f"- **Status:** Pending\n\n"
            f"You can view and manage this on your **Assignments** tab."
        )

        return {
            "reply": reply,
            "intent": "action_created",
            "sources": [],
            "action_performed": {
                "type": "assignment_created",
                "assignment_id": new_assignment.id,
                "course": matched_course,
                "title": title_cleaned,
                "due_date": due_date
            },
            "student_context": {"name": student.name, "program": student.program}
        }

    @staticmethod
    async def _handle_complete_assignment_action(message: str, student: User, db: Session, context: Dict[str, Any]) -> Dict[str, Any]:
        # Find matching pending assignment
        assignments = db.query(Assignment).filter(
            Assignment.student_id == student.id,
            Assignment.status == "Pending"
        ).all()

        target = None
        for a in assignments:
            if a.course_code.lower() in message.lower() or a.title.lower() in message.lower():
                target = a
                break
        
        if not target and assignments:
            target = assignments[0] # complete first pending if ambiguous

        if target:
            target.status = "Completed"
            db.commit()
            reply = f"🎉 Marked assignment **'{target.title}'** for **{target.course_code}** as **Completed**!"
            return {
                "reply": reply,
                "intent": "action_completed",
                "sources": [],
                "action_performed": {"type": "assignment_completed", "id": target.id, "title": target.title},
                "student_context": {"name": student.name}
            }
        else:
            return {
                "reply": "I couldn't find any pending assignment matching that description. Please check your Assignments page.",
                "intent": "student_assignment",
                "sources": [],
                "student_context": {"name": student.name}
            }

    @staticmethod
    async def _handle_create_ticket_action(message: str, student: User, db: Session, context: Dict[str, Any]) -> Dict[str, Any]:
        # Determine category
        lower = message.lower()
        category = "Student Services"
        if "id card" in lower:
            category = "ID card"
        elif "exam" in lower or "grade" in lower or "re-eval" in lower:
            category = "Examination"
        elif "wifi" in lower or "portal" in lower or "login" in lower or "it" in lower:
            category = "IT support"
        elif "library" in lower or "book" in lower:
            category = "Library"
        elif "hostel" in lower or "room" in lower or "mess" in lower:
            category = "Hostel"
        elif "fee" in lower or "payment" in lower or "receipt" in lower:
            category = "Fees"

        import random
        ticket_num = f"TICK-{random.randint(1000, 9999)}"
        subject_text = message.replace("create ticket", "").replace("raise ticket", "").strip(" :-,")
        if not subject_text or len(subject_text) < 5:
            subject_text = f"Support Request: {category}"

        new_ticket = SupportTicket(
            ticket_number=ticket_num,
            student_id=student.id,
            category=category,
            subject=subject_text[:150],
            description=message,
            priority="Medium",
            status="Open"
        )
        db.add(new_ticket)
        db.commit()
        db.refresh(new_ticket)

        reply = (
            f"🎫 **Campus Support Ticket Created!**\n\n"
            f"- **Ticket #:** {ticket_num}\n"
            f"- **Category:** {category}\n"
            f"- **Subject:** {subject_text[:150]}\n"
            f"- **Status:** Open\n\n"
            f"The administration team has been notified. You can track this under the **Support** section."
        )

        return {
            "reply": reply,
            "intent": "action_created",
            "sources": [],
            "action_performed": {
                "type": "ticket_created",
                "ticket_number": ticket_num,
                "category": category,
                "subject": subject_text
            },
            "student_context": {"name": student.name}
        }

    @staticmethod
    def _handle_student_attendance_query(message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        att_list = context["attendance"]
        if not att_list:
            return {
                "reply": "No attendance records found for your enrolled courses.",
                "intent": "student_attendance",
                "sources": [],
                "student_context": context
            }

        # Check if specific course asked
        for item in att_list:
            if item["short_name"].lower() in message.lower() or item["course_name"].lower() in message.lower():
                status_str = "⚠️ Below 75% required threshold!" if item["percentage"] < 75 else "✅ Safe (Above 75%)"
                reply = (
                    f"📊 **Attendance for {item['course_name']} ({item['short_name']}):**\n\n"
                    f"- **Attended:** {item['attended_classes']} / {item['total_classes']} classes\n"
                    f"- **Current Percentage:** **{item['percentage']}%**\n"
                    f"- **Status:** {status_str}\n"
                )
                return {
                    "reply": reply,
                    "intent": "student_attendance",
                    "sources": [],
                    "student_context": context
                }

        # Overall list
        lines = [f"📊 **Here is your subject-wise attendance breakdown, {context['name']}:**\n"]
        total_att = 0
        total_cls = 0
        for item in att_list:
            flag = "⚠️" if item["percentage"] < 75 else "✅"
            lines.append(f"- **{item['short_name']}** ({item['course_name']}): **{item['percentage']}%** ({item['attended_classes']}/{item['total_classes']}) {flag}")
            total_att += item['attended_classes']
            total_cls += item['total_classes']

        overall = round((total_att / total_cls * 100), 1) if total_cls > 0 else 0
        lines.append(f"\n📈 **Overall Aggregate Attendance:** **{overall}%**")
        if overall < 75:
            lines.append("\n> ⚠️ *Note: College regulations require a minimum of 75% attendance to be eligible for end-semester examinations.*")

        return {
            "reply": "\n".join(lines),
            "intent": "student_attendance",
            "sources": [],
            "student_context": context
        }

    @staticmethod
    def _handle_student_schedule_query(message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        timetable = context.get("timetable", [])
        if not timetable:
            return {
                "reply": "No scheduled timetable found for your current semester.",
                "intent": "student_schedule",
                "sources": [],
                "student_context": context
            }

        # Days
        days_map = {"monday": "Monday", "tuesday": "Tuesday", "wednesday": "Wednesday", "thursday": "Thursday", "friday": "Friday"}
        target_day = None
        for k, v in days_map.items():
            if k in message.lower():
                target_day = v
                break

        if not target_day:
            if "tomorrow" in message.lower():
                target_day = "Tuesday" # Sample sensible default
            else:
                target_day = "Monday"

        slots = [s for s in timetable if s["day"].lower() == target_day.lower()]
        if not slots:
            slots = timetable[:3] # fallback

        lines = [f"📅 **Your Classes for {target_day} ({context['program']} Sem {context['semester']}):**\n"]
        for s in slots:
            lines.append(f"- **{s['time']}**: **{s['course']}** ({s['course_name']}) at `{s['room']}`")

        return {
            "reply": "\n".join(lines),
            "intent": "student_schedule",
            "sources": [],
            "student_context": context
        }

    @staticmethod
    def _handle_student_assignments_query(context: Dict[str, Any]) -> Dict[str, Any]:
        assignments = context.get("pending_assignments", [])
        if not assignments:
            return {
                "reply": f"🎉 Great news, {context['name']}! You have no pending assignments right now.",
                "intent": "student_assignment",
                "sources": [],
                "student_context": context
            }

        lines = [f"📝 **You have {len(assignments)} pending assignment(s), {context['name']}:**\n"]
        for idx, a in enumerate(assignments, 1):
            lines.append(f"{idx}. **[{a['course']}]** {a['title']}\n   - **Due Date:** {a['due_date']} | **Priority:** {a['priority']}")

        lines.append("\n💡 *Tip: You can say 'Mark my DBMS assignment as completed' to update it directly!*")

        return {
            "reply": "\n".join(lines),
            "intent": "student_assignment",
            "sources": [],
            "student_context": context
        }

    @staticmethod
    def _handle_student_exams_query(context: Dict[str, Any]) -> Dict[str, Any]:
        exams = context.get("exams", [])
        if not exams:
            return {
                "reply": "No exam schedules published yet for your current semester.",
                "intent": "student_exams",
                "sources": [],
                "student_context": context
            }

        lines = [f"📋 **Upcoming End-Semester Exam Schedule ({context['program']} Semester {context['semester']}):**\n"]
        for e in exams:
            lines.append(f"- **{e['course']}** ({e['course_name']}): **{e['date']}** ({e['time']}) at `{e['venue']}`")

        return {
            "reply": "\n".join(lines),
            "intent": "student_exams",
            "sources": [],
            "student_context": context
        }

    @staticmethod
    async def _handle_hybrid_rag_query(
        query: str,
        student: User,
        context: Dict[str, Any],
        history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Executes Hybrid RAG:
        1. Retrieves relevant college documents via dense Qdrant vector search + sparse BM25 search.
        2. Injects student profile & course context into LLM prompt.
        3. Calls local Llama 3.2:3b to synthesize a precise answer with citations.
        """
        # Hybrid retrieval
        chunks = await hybrid_retriever.search(query, top_k=4)

        # Build citations
        sources = []
        context_docs = []
        for c in chunks:
            sources.append({
                "document_title": c.get("document_title", c.get("source_file", "College Document")),
                "source_file": c.get("source_file", "document.pdf"),
                "category": c.get("category", "Regulations"),
                "page": c.get("page", 1),
                "snippet": c.get("text", "")[:280] + "...",
                "score": c.get("fusion_score", 0.0)
            })
            context_docs.append(
                f"[Document: {c.get('document_title', c.get('source_file'))} | Page: {c.get('page', 1)} | Category: {c.get('category')}]\n"
                f"{c.get('text')}\n"
            )

        context_str = "\n---\n".join(context_docs) if context_docs else "No specific documents found."

        enrolled_str = ", ".join([f"{c['short_name']} ({c['name']})" for c in context.get("enrolled_courses", [])])

        system_prompt = (
            f"You are Campus AI Assist, an intelligent, helpful, and polite college academic support assistant.\n"
            f"You are assisting a student named {student.name} enrolled in {student.program} (Semester {student.semester}, Department of {student.department}).\n"
            f"Current Enrolled Courses: {enrolled_str}.\n\n"
            f"Guidelines:\n"
            f"1. Answer the student's question accurately based primarily on the provided College Knowledge Base context.\n"
            f"2. Keep your answers concise, structured (using bullet points and bold headers), and directly helpful.\n"
            f"3. Explicitly cite the document source (e.g. 'According to the Academic Regulations 2026 (Page 2)...').\n"
            f"4. If the exact answer is not in the knowledge base, politely state what is known and advise the student to contact the respective department or raise a Support Ticket."
        )

        user_prompt = (
            f"College Knowledge Base Context:\n"
            f"{context_str}\n\n"
            f"Student Question: {query}\n\n"
            f"Provide a clear, helpful answer with source references where applicable:"
        )

        llm_reply = await llm_client.generate_response(system_prompt, user_prompt)

        return {
            "reply": llm_reply,
            "intent": "academic_rag",
            "sources": sources,
            "student_context": {
                "name": student.name,
                "program": student.program,
                "semester": student.semester,
                "department": student.department
            }
        }

context_engine = ContextEngine()
