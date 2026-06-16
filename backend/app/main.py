from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db, engine
from app import models
from app import crud
from app.schemas import UserCreate, UserResponse, UserLogin, Token
from app.auth import verify_password, create_access_token, get_current_user
from typing import List
from app.schemas import CycleCreate, CycleResponse, CyclePrediction, MoodCreate, MoodResponse, MoodStats
import os
# Create all tables in the database on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="LunaFlow API")

# CORS — allows React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
    ],
    allow_credentials=True,
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
    return crud.create_user(db=db, user=user)


@app.post("/auth/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if not db_user or not verify_password(user.password, str(db_user.hashed_password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    token = create_access_token(data={"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return current_user


@app.post("/cycles", response_model=CycleResponse, status_code=201)
def log_cycle(
    cycle: CycleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.create_cycle(db=db, cycle=cycle, user_id=current_user.id)


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


@app.get("/moods/stats", response_model=MoodStats)
def mood_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.get_mood_stats(db=db, user_id=current_user.id)