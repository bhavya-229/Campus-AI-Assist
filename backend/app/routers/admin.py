import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.document import IngestedDocument
from app.schemas.admin import DocumentOut, DocumentIndexResponse
from app.rag.document_processor import DocumentProcessor
from app.rag.qdrant_store import qdrant_store
from app.rag.hybrid_retriever import hybrid_retriever
from app.utils.auth_deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

UPLOAD_DIR = "./data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/documents", response_model=List[DocumentOut])
def get_documents(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(IngestedDocument).order_by(IngestedDocument.created_at.desc()).all()

@router.post("/documents/upload", response_model=DocumentIndexResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form("General Regulations"),
    description: Optional[str] = Form(""),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Save file to disk
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)
    file_ext = os.path.splitext(file.filename)[1].replace(".", "").lower() or "txt"

    # Process & Chunk
    pages = DocumentProcessor.extract_text_from_file(file_path)
    chunks = DocumentProcessor.chunk_documents(pages)

    if not chunks:
        raise HTTPException(status_code=400, detail="Could not extract readable text chunks from file")

    # Ingest into Qdrant Vector Store
    indexed_count = await qdrant_store.add_documents(chunks, category=category, doc_title=title)

    # Re-sync BM25 Index
    hybrid_retriever.sync_bm25_from_qdrant()

    # Save to Database
    doc_record = IngestedDocument(
        filename=file.filename,
        title=title,
        category=category,
        file_type=file_ext,
        total_chunks=indexed_count,
        file_size_bytes=file_size,
        description=description
    )
    db.add(doc_record)
    db.commit()
    db.refresh(doc_record)

    return DocumentIndexResponse(
        message=f"Successfully indexed '{title}' into Qdrant & BM25 ({indexed_count} chunks).",
        document=doc_record,
        indexed_chunks=indexed_count
    )

@router.delete("/documents/{doc_id}")
def delete_document(
    doc_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    doc = db.query(IngestedDocument).filter(IngestedDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    filename = doc.filename
    title = doc.title

    # 1. Delete vector points from Qdrant
    qdrant_store.delete_documents_by_filename(filename)

    # 2. Delete database record
    db.delete(doc)
    db.commit()

    # 3. Synchronize BM25 index
    hybrid_retriever.sync_bm25_from_qdrant()

    # 4. Clean up uploaded physical file if exists
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass

    return {"message": f"Document '{title}' ({filename}) successfully removed from SQL, Qdrant vectors, and BM25 index."}
