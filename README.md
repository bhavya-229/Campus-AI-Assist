# Campus AI Assist 🎓
### AI-Powered Academic & Student Support Platform

A full-stack, context-aware AI assistant and academic portal designed for college students and faculty/administration. Built using **React + Vite**, **Python FastAPI**, **Qdrant Vector Database**, **BM25 Sparse Search (Hybrid RAG)**, **SQLAlchemy (MySQL/SQLite)**, and local LLM (**Llama 3.2:3b** via Ollama).

---

## 🌟 Key Features

1. **Academic Knowledge Q&A (Hybrid RAG)**:
   - Ingests college regulations, syllabus, grading policies, examination guidelines, and hostel/facility rules.
   - Dual search retrieval: Dense vector search via **Qdrant** + Sparse lexical search via **BM25** with **Reciprocal Rank Fusion (RRF)**.
   - Grounded generation with citations (document title, page number, confidence score).

2. **Context-Aware Student Personalization**:
   - Injects student profile (e.g. Bhavya, MCA Sem 2, enrolled in DBMS, DSA, Java, IoT) into assistant reasoning.
   - Understands context queries: *"What's my attendance?"*, *"What classes do I have tomorrow?"*, *"What topics should I study for DBMS?"*.

3. **Conversational Actions**:
   - Natural language task creation: *"Add an assignment for DBMS due Friday"* -> automatically writes to the database.
   - Status updates: *"Mark my DBMS assignment as completed"*.
   - Instant ticket filing: *"My ID card is lost, please raise a ticket"*.

4. **Student Academic Portal**:
   - **Dashboard**: High-level attendance gauge, pending assignments count, exam countdown, today's schedule timeline.
   - **Attendance Tracker**: Subject-wise class counts, percentages, and 75% examination eligibility warning alerts.
   - **Assignment Manager**: Interactive task tracker with priority tags, filters, and one-click completion.
   - **Timetable & Exams**: Weekly lecture grid and upcoming end-semester exam dates.
   - **Support Tickets**: Helpdesk ticketing system with status timeline and admin resolution notes.

5. **Admin Hub & Document Management**:
   - Document upload dropzone for PDFs, text files, and markdown policies.
   - Automated text extraction, overlapping chunking, and real-time indexing into Qdrant Vector Store and BM25 index.

---

## 🏗️ Architecture & Technology Stack

```
                        ┌──────────────────────────────┐
                        │     React + Vite Frontend    │
                        │  (Dashboard, Chat, Portals)  │
                        └──────────────┬───────────────┘
                                       │ HTTP / JWT
                                       ▼
                        ┌──────────────────────────────┐
                        │    Python FastAPI Backend    │
                        │   (Async REST API Routers)   │
                        └──────┬───────┬───────┬───────┘
                               │       │       │
       ┌───────────────────────┘       │       └────────────────────────┐
       ▼                               ▼                                ▼
┌──────────────┐             ┌───────────────────┐             ┌─────────────────┐
│ MySQL/SQLite │             │ Hybrid RAG Engine │             │ Student Actions │
│ (SQLAlchemy) │             │ (Dense + Sparse)  │             │ & Intent Parser │
├──────────────┤             ├───────────────────┤             ├─────────────────┤
│ - Students   │             │ - Qdrant Store    │             │ - Assignments   │
│ - Courses    │             │ - BM25 Retriever  │             │ - Timetables    │
│ - Attendance │             │ - RRF Fusion      │             │ - Tickets       │
│ - Timetable  │             │ - Llama 3.2:3b    │             │                 │
└──────────────┘             └───────────────────┘             └─────────────────┘
```

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite, Vanilla CSS System, Lucide Icons | Responsive student portal & AI assistant interface |
| **Backend** | Python 3.10+, FastAPI, Pydantic, Uvicorn | High-performance async REST APIs & JWT auth |
| **Database** | MySQL / SQLite via SQLAlchemy | Structured student records, attendance, assignments, tickets |
| **Vector DB** | Qdrant (`qdrant-client`) | On-disk local persistent vector embeddings storage |
| **Sparse Search** | `rank-bm25` (BM25Okapi) | Keyword, course code, and regulation code retrieval |
| **LLM & Embeddings** | Ollama (`llama3.2:3b` & `nomic-embed-text`) | Local, privacy-preserving generative AI & dense embeddings |

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm
- Ollama with `llama3.2:3b` and `nomic-embed-text` models:
  ```bash
  ollama pull llama3.2:3b
  ollama pull nomic-embed-text
  ```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed initial database and index college documents into Qdrant
python -m app.seed

# Run the FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend API will be accessible at: `http://localhost:8000` (Interactive Swagger Docs at `http://localhost:8000/docs`).

### 3. Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Start development server
npm run dev
```
Frontend will be accessible at: `http://localhost:5173`.

---

## 🔑 Demo Credentials

| Role | Email | Password | Quick Login |
|---|---|---|---|
| **Student (Bhavya)** | `bhavya@college.edu` | `password123` | Click **"Student Bhavya"** button on login screen |
| **Admin (Dean Academics)** | `admin@college.edu` | `admin123` | Click **"Admin Dean"** button on login screen |
