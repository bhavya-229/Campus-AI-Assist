import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.ticket import SupportTicket
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketOut
from app.utils.auth_deps import get_current_user, get_current_admin

router = APIRouter(prefix="/tickets", tags=["Support Tickets"])

@router.get("", response_model=List[TicketOut])
def get_user_tickets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "admin":
        tickets = db.query(SupportTicket).order_by(SupportTicket.created_at.desc()).all()
    else:
        tickets = db.query(SupportTicket).filter(SupportTicket.student_id == current_user.id).order_by(SupportTicket.created_at.desc()).all()
    
    results = []
    for t in tickets:
        student = db.query(User).filter(User.id == t.student_id).first()
        results.append(TicketOut(
            id=t.id,
            ticket_number=t.ticket_number,
            student_id=t.student_id,
            student_name=student.name if student else "Unknown",
            student_email=student.email if student else "N/A",
            category=t.category,
            subject=t.subject,
            description=t.description,
            priority=t.priority,
            status=t.status,
            resolution_notes=t.resolution_notes,
            created_at=t.created_at,
            updated_at=t.updated_at
        ))
    return results

@router.post("", response_model=TicketOut)
def create_ticket(
    ticket_in: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket_number = f"TICK-{random.randint(1000, 9999)}"
    ticket = SupportTicket(
        ticket_number=ticket_number,
        student_id=current_user.id,
        category=ticket_in.category,
        subject=ticket_in.subject,
        description=ticket_in.description,
        priority=ticket_in.priority or "Medium",
        status="Open"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    return TicketOut(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        student_id=ticket.student_id,
        student_name=current_user.name,
        student_email=current_user.email,
        category=ticket.category,
        subject=ticket.subject,
        description=ticket.description,
        priority=ticket.priority,
        status=ticket.status,
        resolution_notes=ticket.resolution_notes,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at
    )

@router.patch("/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: int,
    ticket_in: TicketUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role != "admin" and ticket.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this ticket")

    if ticket_in.status:
        ticket.status = ticket_in.status
    if ticket_in.resolution_notes:
        ticket.resolution_notes = ticket_in.resolution_notes
    if ticket_in.priority and current_user.role == "admin":
        ticket.priority = ticket_in.priority

    db.commit()
    db.refresh(ticket)
    
    student = db.query(User).filter(User.id == ticket.student_id).first()
    return TicketOut(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        student_id=ticket.student_id,
        student_name=student.name if student else "Unknown",
        student_email=student.email if student else "N/A",
        category=ticket.category,
        subject=ticket.subject,
        description=ticket.description,
        priority=ticket.priority,
        status=ticket.status,
        resolution_notes=ticket.resolution_notes,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at
    )
