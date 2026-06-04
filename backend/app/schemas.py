from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from datetime import date



# --- Request schemas (what the client sends) ---

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str



# --- Response schemas (what we send back) ---

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None

# --- Cycle schemas ---

class CycleCreate(BaseModel):
    start_date: datetime
    end_date: Optional[datetime] = None
    notes: Optional[str] = None


class CycleResponse(BaseModel):
    id: int
    user_id: int
    start_date: datetime
    end_date: Optional[datetime]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class CyclePrediction(BaseModel):
    predicted_next_start: Optional[datetime]
    average_cycle_length_days: Optional[float]
    cycles_used_for_prediction: int
    confidence: str  # "low", "medium", "high"

# --- Mood schemas ---

class MoodCreate(BaseModel):
    mood_score: int  # 1-5
    energy_level: Optional[int] = None  # 1-5
    note: Optional[str] = None


class MoodResponse(BaseModel):
    id: int
    user_id: int
    mood_score: int
    energy_level: Optional[int]
    note: Optional[str]
    logged_at: datetime

    class Config:
        from_attributes = True


class MoodStats(BaseModel):
    average_mood: Optional[float]
    average_energy: Optional[float]
    total_entries: int
    recent_trend: str  # "improving", "declining", "stable"