import asyncio
import sys

# Fix windows console unicode encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from app.database import SessionLocal
from app.models.user import User
from app.rag.hybrid_retriever import hybrid_retriever
from app.rag.context_engine import context_engine

async def main():
    print("=== Testing Campus AI Assist Hybrid RAG & Context Engine ===")
    db = SessionLocal()
    student = db.query(User).filter(User.email == "bhavya@college.edu").first()
    print(f"Loaded Student: {student.name} ({student.student_id}) - {student.program} Sem {student.semester}")

    # 1. Test Hybrid Retrieval
    print("\n--- Testing Hybrid Retrieval (Qdrant + BM25) ---")
    query = "What is the minimum attendance required for exams?"
    chunks = await hybrid_retriever.search(query, top_k=2)
    for c in chunks:
        print(f"Chunk from [{c['document_title']}] (Page {c['page']}) Fusion Score: {c['fusion_score']}")
        print(f"Snippet: {c['text'][:150]}...\n")

    # 2. Test Student Attendance Query
    print("\n--- Testing Contextual Attendance Query ---")
    res1 = await context_engine.process_user_query("What is my attendance in DBMS?", student, db)
    print("Intent:", res1["intent"])
    print("Reply:\n", res1["reply"])

    # 3. Test Student Timetable Query
    print("\n--- Testing Contextual Timetable Query ---")
    res2 = await context_engine.process_user_query("What classes do I have tomorrow?", student, db)
    print("Intent:", res2["intent"])
    print("Reply:\n", res2["reply"])

    # 4. Test Student Action Intent (Add Assignment)
    print("\n--- Testing Conversational Action: Add Assignment ---")
    res3 = await context_engine.process_user_query("Add an assignment for DBMS: BCNF Decomposition due Friday", student, db)
    print("Intent:", res3["intent"])
    print("Reply:\n", res3["reply"])

    # 5. Test Academic Policy RAG Query with Llama 3.2
    print("\n--- Testing Academic Policy RAG with Local LLM ---")
    res4 = await context_engine.process_user_query("What are the rules and fees for re-evaluation?", student, db)
    print("Intent:", res4["intent"])
    print("Reply:\n", res4["reply"])
    print("Sources:", len(res4["sources"]), "documents cited.")

    db.close()
    print("\n[+] All backend tests completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
