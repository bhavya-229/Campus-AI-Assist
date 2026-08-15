from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.rag.context_engine import context_engine
from app.utils.auth_deps import get_current_user

router = APIRouter(prefix="/chat", tags=["AI Assistant"])

@router.post("", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    history_payload = [{"role": h.role, "content": h.content} for h in (request.history or [])]
    
    result = await context_engine.process_user_query(
        user_message=request.message,
        student=current_user,
        db=db,
        history=history_payload
    )

    return ChatResponse(
        reply=result["reply"],
        intent=result.get("intent", "general"),
        sources=result.get("sources", []),
        action_performed=result.get("action_performed"),
        student_context=result.get("student_context")
    )
