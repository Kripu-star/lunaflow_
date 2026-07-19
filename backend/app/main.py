from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db, engine
from app import models
from app import crud
from app.schemas import UserCreate, UserResponse, UserLogin, Token, ResendVerificationRequest
from app.email_utils import send_verification_email
from app.auth import verify_password, create_access_token, get_current_user
from typing import List
from app.schemas import CycleCreate, CycleResponse, CyclePrediction, MoodCreate, MoodResponse, MoodStats
from app.chat import chat_with_gemini
from app.schemas import ChatRequest, ChatResponse
from app.schemas import UserUpdate
import os
# Create all tables in the database on startup
models.Base.metadata.create_all(bind=engine)

# Idempotent column migration (no Alembic in this project) — safe to run
# on every startup, ADD COLUMN IF NOT EXISTS is a no-op once applied.
with engine.connect() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ"))
    conn.commit()

engine.dispose()

app = FastAPI(title="LunaFlow API")

# CORS — allows React frontend to talk to this backend
# Update your CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://lunaflow-omega.vercel.app", # Your production frontend
        "http://localhost:3000",             # Standard React local dev
        "http://localhost:5173",             # Standard Vite local dev
    ],
    allow_credentials=True,                  # Changed from False to True
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/health") 
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))



@app.post("/auth/register", response_model=UserResponse, status_code=201)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_email(db, email=user.email)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    db_user = crud.create_user(db=db, user=user)
    try:
        send_verification_email(db_user.email, db_user.full_name, db_user.verification_token)
    except Exception as e:
        # Don't fail signup if the email provider is down — user can resend later.
        print(f"Failed to send verification email to {db_user.email}: {e}")
    return db_user


@app.post("/auth/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if not db_user or not verify_password(user.password, str(db_user.hashed_password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    if not db_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in."
        )
    token = create_access_token(data={"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    try:
        crud.verify_user_email(db=db, token=token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Email verified"}


@app.post("/auth/resend-verification")
def resend_verification(body: ResendVerificationRequest, db: Session = Depends(get_db)):
    user = crud.regenerate_verification_token(db=db, email=body.email)
    if user:
        try:
            send_verification_email(user.email, user.full_name, user.verification_token)
        except Exception as e:
            print(f"Failed to resend verification email to {user.email}: {e}")
    return {"message": "If that email is registered and unverified, a new link has been sent."}


@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return current_user


@app.post("/cycles", response_model=CycleResponse, status_code=201)
def log_cycle(
    cycle: CycleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return crud.create_cycle(db=db, cycle=cycle, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/cycles", response_model=List[CycleResponse])
def list_cycles(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.get_user_cycles(db=db, user_id=current_user.id)


@app.get("/cycles/prediction", response_model=CyclePrediction)
def get_prediction(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.predict_next_cycle(db=db, user_id=current_user.id)

@app.post("/moods", response_model=MoodResponse, status_code=201)
def log_mood(
    mood: MoodCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not 1 <= mood.mood_score <= 5:
        raise HTTPException(status_code=400, detail="Mood score must be 1-5")
    if mood.energy_level and not 1 <= mood.energy_level <= 5:
        raise HTTPException(status_code=400, detail="Energy level must be 1-5")
    return crud.create_mood(db=db, mood=mood, user_id=current_user.id)


@app.get("/moods", response_model=List[MoodResponse])
def list_moods(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.get_user_moods(db=db, user_id=current_user.id)


@app.delete("/moods/{mood_id}", status_code=204)
def remove_mood(
    mood_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        crud.delete_mood(db=db, mood_id=mood_id, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/moods/stats", response_model=MoodStats)
def mood_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.get_mood_stats(db=db, user_id=current_user.id)

@app.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if request.persona not in ["doctor", "parent", "partner"]:
        raise HTTPException(
            status_code=400,
            detail="Persona must be 'doctor', 'parent', or 'partner'"
        )

    response_text = chat_with_gemini(
        persona=request.persona,
        message=request.message,
        history=[msg.model_dump() for msg in request.history],
        user=current_user,
        db=db,
    )

    return {"response": response_text, "persona": request.persona}

@app.patch("/auth/me", response_model=UserResponse)
def update_profile(
    updates: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.update_user(
        db=db,
        user_id=current_user.id,
        updates=updates.model_dump(exclude_none=True)
    )

from app.schemas import CyclePhase

@app.get("/cycles/phase", response_model=CyclePhase)
def get_cycle_phase(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.get_current_cycle_phase(db=db, user_id=current_user.id)

@app.delete("/cycles/{cycle_id}", status_code=204)
def remove_cycle(
    cycle_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        crud.delete_cycle(db=db, cycle_id=cycle_id, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))