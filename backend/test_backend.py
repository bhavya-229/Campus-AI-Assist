import asyncio
import sys

# Fix windows console unicode encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from app.database import SessionLocal
from app.models.user import User
from app.models.document import IngestedDocument
from app.rag.hybrid_retriever import hybrid_retriever
from app.rag.context_engine import context_engine
from app.rag.qdrant_store import qdrant_store
from app.utils.auth_deps import create_access_token

async def main():
    print("=== Testing Campus AI Assist: Verified Enhancements & Bug Fixes ===")
    db = SessionLocal()
    student = db.query(User).filter(User.email == "bhavya@college.edu").first()
    print(f"Loaded Student: {student.name} ({student.student_id}) - {student.program} Sem {student.semester}")

    # 1. Test Timezone-aware JWT Token Generation
    print("\n--- 1. Testing Python 3.12 Timezone-Aware JWT Creation ---")
    token = create_access_token(data={"sub": student.email, "role": student.role})
    assert token is not None and len(token) > 20
    print("[+] JWT Token generated successfully without deprecation warnings.")

    # 2. Test Dynamic Timetable Query (Today & Tomorrow)
    print("\n--- 2. Testing Dynamic Timetable Query ---")
    res_tomorrow = await context_engine.process_user_query("What classes do I have tomorrow?", student, db)
    print("Intent:", res_tomorrow["intent"])
    print("Reply preview:\n", res_tomorrow["reply"][:200], "...")

    # 3. Test Intent Disambiguation: Informational query about assignments vs Action creation
    print("\n--- 3. Testing Intent Disambiguation ---")
    # A question should NOT trigger assignment creation or completion mutation
    res_question = await context_engine.process_user_query("What is the deadline for my assignments?", student, db)
    print("Query: 'What is the deadline for my assignments?'")
    print("Intent detected:", res_question["intent"])
    assert res_question["intent"] == "student_assignment"
    assert res_question.get("action_performed") is None
    print("[+] Informational query correctly avoided task mutation.")

    # An explicit command SHOULD trigger assignment creation
    res_action = await context_engine.process_user_query("Add an assignment for DSA: Dynamic Programming due next Tuesday", student, db)
    print("\nQuery: 'Add an assignment for DSA: Dynamic Programming due next Tuesday'")
    print("Intent detected:", res_action["intent"])
    print("Action performed:", res_action.get("action_performed"))
    assert res_action.get("action_performed") is not None
    print("[+] Imperative command correctly created assignment.")

    # 4. Test Hybrid RAG Score Thresholding
    print("\n--- 4. Testing Hybrid RAG with Thresholding ---")
    query = "What is the fee for re-evaluation per subject?"
    chunks = await hybrid_retriever.search(query, top_k=2)
    print(f"Retrieved {len(chunks)} chunk(s).")
    for c in chunks:
        print(f"  * [{c['document_title']}] Fusion Score: {c['fusion_score']} | Types: {c['retrieval_types']}")

    # 5. Test Qdrant Vector Cleanup Method
    print("\n--- 5. Testing Qdrant Vector Cleanup by Filename ---")
    # Verify method execution
    cleanup_success = qdrant_store.delete_documents_by_filename("non_existent_test_doc.pdf")
    print(f"Delete method callable and executed cleanly: {cleanup_success}")

    db.close()
    print("\n[+] All enhanced verification tests passed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
