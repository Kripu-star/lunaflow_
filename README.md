# 🌙 LunaFlow

> A full-stack menstrual health & mood wellness web application — 
> built to help women track cycles, understand patterns, and feel supported.

![Status](https://img.shields.io/badge/Status-In%20Development-purple)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20FastAPI%20%7C%20PostgreSQL-blue)

---

## 🎯 What It Does

LunaFlow helps users:
- **Log menstrual cycles** and track patterns over time
- **Predict next period dates** using cycle history analysis
- **Journal moods** with AI-powered emotion detection 
- **Chat with AI companions** — Doctor, Partner, or Parent persona (Phase 2)
- **Receive personalized recommendations** for food, yoga & schedule (Phase 3)

---

## 🏗️ Architecture

```
React Frontend (Tailwind CSS)
        ↕ HTTP/REST
FastAPI Backend (Python)
        ↕ SQLAlchemy ORM
PostgreSQL Database
```

**Why this stack?**
- **FastAPI** — chosen for automatic OpenAPI docs, Pydantic validation, 
  and native async support (needed for Claude API calls in Phase 2)
- **PostgreSQL** — relational data fits naturally: users → cycles → logs → moods
- **React + Tailwind** — component-based UI with utility-first styling
- **SQLAlchemy ORM** — type-safe database access with connection pooling

---

## 📁 Project Structure

```
lunaflow/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI routes
│   │   ├── database.py      # SQLAlchemy engine + session management
│   │   ├── models.py        # ORM table definitions (in progress)
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   └── crud.py          # Database operations
│   └── requirements.txt
└── frontend/                # React app (in progress)
```

---

## 🚀 Current Status

### ✅ Phase 1 — Completed
- [x] FastAPI backend skeleton with `/health` endpoint
- [x] PostgreSQL connection with SQLAlchemy (connection pooling, 
      session management)
- [x] Environment-based configuration (12-Factor App principles)
- [x] User authentication (JWT)
- [x] Period logging endpoints
- [x] Cycle prediction algorithm
- [x] React frontend

### 🔜 Phase 2 — Under progress
- [x] Mood journaling with HuggingFace emotion detection
- [ ] AI companion personas via Claude API

### 🔜 Phase 3 — Planned
- [ ] Food, yoga & schedule recommendations
- [ ] Stress-based cycle delay detection

---

## 🛠️ Local Setup

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Run
uvicorn app.main:app --reload

#Frontend

cd frontend

#install dependencies
npm install

#Run the development server
npm run dev

```

---

## 💡 Engineering Decisions

**Why a moving average for cycle prediction instead of ML?**  
With 5-20 cycles per user, a weighted moving average outperforms 
ML models — there isn't enough per-user data to train on. 
ML becomes meaningful at population scale (Phase 3+).

**Why separate Engine and Session in SQLAlchemy?**  
The Engine manages a connection pool (expensive TCP connections, 
created once). Sessions are lightweight per-request wrappers 
that borrow a connection briefly. This is standard connection 
pooling architecture.

**Why FastAPI over Flask or Django?**  
Flask requires manual validation and docs. Django is too heavy 
for an API-only backend. FastAPI gives Pydantic validation, 
auto OpenAPI docs, and async support out of the box.

---

*Built by Pushpam Kumari — learning full-stack development 
by building real projects.*
