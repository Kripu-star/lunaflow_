from sqlalchemy.orm import Session
from app.models import User
from app.schemas import UserCreate
from app.auth import hash_password
from typing import List, cast
from datetime import timedelta
from app.models import Cycle
from app.schemas import CycleCreate
from app.models import Mood
from app.schemas import MoodCreate
from sqlalchemy import func


def get_user_by_email(db: Session, email: str):
    """Fetch a user by email address."""
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int):
    """Fetch a user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, user: UserCreate):
    """Create a new user with a hashed password."""
    hashed = hash_password(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_cycle(db: Session, cycle: CycleCreate, user_id: int):
    from sqlalchemy import func
    from datetime import datetime

    start = cycle.start_date
    if start.tzinfo is not None:
        start = start.replace(tzinfo=None)

    existing = db.query(Cycle).filter(
        Cycle.user_id == user_id,
        func.date(Cycle.start_date) == start.date()
    ).first()

    if existing:
        raise ValueError(f"A cycle already exists for {start.date()}")

    db_cycle = Cycle(
        user_id=user_id,
        start_date=cycle.start_date,
        end_date=cycle.end_date,
        period_length_days=cycle.period_length_days,
        notes=cycle.notes,
    )
    db.add(db_cycle)
    db.commit()
    db.refresh(db_cycle)
    return db_cycle


def predict_next_cycle(db: Session, user_id: int):
    from datetime import timedelta

    cycles = (
        db.query(Cycle)
        .filter(Cycle.user_id == user_id)
        .order_by(Cycle.start_date.desc())
        .limit(6)
        .all()
    )

    user = db.query(User).filter(User.id == user_id).first()
    typical = user.typical_cycle_length if user and user.typical_cycle_length else None

    if len(cycles) < 2 and not typical:
        return {
            "predicted_next_start": None,
            "average_cycle_length_days": typical,
            "cycles_used_for_prediction": len(cycles),
            "confidence": "low",
        }

    cycles_oldest_first = list(reversed(cycles))
    gaps = []
    for i in range(1, len(cycles_oldest_first)):
        delta = cycles_oldest_first[i].start_date - cycles_oldest_first[i - 1].start_date
        if delta.days >= 15:  # ignore gaps less than 15 days (duplicates/errors)
            gaps.append(delta.days)

    if gaps:
        # Weight recent gaps more heavily
        weights = list(range(1, len(gaps) + 1))
        weighted_avg = sum(g * w for g, w in zip(gaps, weights)) / sum(weights)
        avg_gap = round(weighted_avg, 1)
        confidence = "high" if len(gaps) >= 3 else "medium"
    elif typical:
        avg_gap = typical
        confidence = "low"
    else:
        return {
            "predicted_next_start": None,
            "average_cycle_length_days": None,
            "cycles_used_for_prediction": 0,
            "confidence": "low",
        }

    last_start = cycles[0].start_date
    predicted = last_start + timedelta(days=avg_gap)

    return {
        "predicted_next_start": predicted,
        "average_cycle_length_days": avg_gap,
        "cycles_used_for_prediction": len(gaps),
        "confidence": confidence,
    }
   
   


def get_user_cycles(db: Session, user_id: int) -> List[Cycle]:
    """Fetch all cycles for a specific user, newest first."""
    return (
        db.query(Cycle)
        .filter(Cycle.user_id == user_id)
        .order_by(Cycle.start_date.desc())
        .all()
    )


def create_mood(db: Session, mood: MoodCreate, user_id: int):
    db_mood = Mood(
        user_id=user_id,
        mood_score=mood.mood_score,
        energy_level=mood.energy_level,
        note=mood.note,
    )
    db.add(db_mood)
    db.commit()
    db.refresh(db_mood)
    return db_mood


def get_user_moods(db: Session, user_id: int, limit: int = 30):
    return (
        db.query(Mood)
        .filter(Mood.user_id == user_id)
        .order_by(Mood.logged_at.desc())
        .limit(limit)
        .all()
    )


def get_mood_stats(db: Session, user_id: int):
    moods = (
        db.query(Mood)
        .filter(Mood.user_id == user_id)
        .order_by(Mood.logged_at.desc())
        .limit(7)
        .all()
    )

    if not moods:
        return {
            "average_mood": None,
            "average_energy": None,
            "total_entries": 0,
            "recent_trend": "stable",
        }

    avg_mood = sum(float(cast(int, m.mood_score)) for m in moods) / len(moods)
    energy_scores = [float(cast(int, m.energy_level)) for m in moods if m.energy_level is not None]
    avg_energy = sum(energy_scores) / len(energy_scores) if energy_scores else None

    # Trend: compare first half vs second half of recent entries
    if len(moods) >= 4:
        mid = len(moods) // 2
        recent_avg = sum(float(cast(int, m.mood_score)) for m in moods[:mid]) / mid
        older_avg = sum(float(cast(int, m.mood_score)) for m in moods[mid:]) / (len(moods) - mid)
        if recent_avg > older_avg + 0.3:
            trend = "improving"
        elif recent_avg < older_avg - 0.3:
            trend = "declining"
        else:
            trend = "stable"
    else:
        trend = "stable"

    total = db.query(Mood).filter(Mood.user_id == user_id).count()

    return {
        "average_mood": round(avg_mood, 1),
        "average_energy": round(avg_energy, 1) if avg_energy else None,
        "total_entries": total,
        "recent_trend": trend,
    }
def update_user(db: Session, user_id: int, updates: dict):
    user = db.query(User).filter(User.id == user_id).first()
    for key, value in updates.items():
        if value is not None:
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user

def get_current_cycle_phase(db: Session, user_id: int):
    from datetime import datetime, timezone, timedelta

    cycles = (
        db.query(Cycle)
        .filter(Cycle.user_id == user_id)
        .order_by(Cycle.start_date.desc())
        .first()
    )

    if not cycles:
        return {
            "phase": "unknown",
            "day_of_cycle": None,
            "description": "Log your first period to see your cycle phase",
            "emoji": "🌙",
            "tips": [],
        }

    now = datetime.now(timezone.utc)
    last_start = cycles.start_date
    if last_start.tzinfo is None:
        last_start = last_start.replace(tzinfo=timezone.utc)

    day_of_cycle = (now - last_start).days + 1

    # Get cycle length for phase boundaries
    prediction = predict_next_cycle(db, user_id)
    cycle_length = prediction.get("average_cycle_length_days") or 28
    period_length = cycles.period_length_days or 5

    if day_of_cycle <= period_length:
        phase = "Menstruation"
        emoji = "🔴"
        description = "Your period is here. Rest and be gentle with yourself."
        tips = [
            "Stay warm and hydrated",
            "Iron-rich foods: spinach, lentils, tofu",
            "Gentle yoga or walking only",
            "Prioritize sleep",
        ]
    elif day_of_cycle <= 13:
        phase = "Follicular"
        emoji = "🌱"
        description = "Energy is rising. Great time to start new things."
        tips = [
            "Good time for new projects and social plans",
            "Increase protein intake",
            "Higher energy workouts are great now",
            "Your skin is at its clearest",
        ]
    elif day_of_cycle <= 16:
        phase = "Ovulation"
        emoji = "✨"
        description = "Peak energy and confidence. You're glowing."
        tips = [
            "Best time for important meetings or presentations",
            "High intensity workouts feel easier now",
            "Social battery is at its highest",
            "Great time for creative work",
        ]
    elif day_of_cycle <= cycle_length:
        phase = "Luteal"
        emoji = "🌙"
        days_to_period = int(cycle_length) - day_of_cycle + 1
        if days_to_period <= 5:
            description = f"PMS territory. Period arriving in ~{days_to_period} days."
            tips = [
                "Reduce caffeine and salt",
                "Magnesium-rich foods help: dark chocolate, nuts",
                "Gentle exercise like yoga or walking",
                "Extra self-care and rest",
            ]
        else:
            description = "Luteal phase. Energy slowly winding down."
            tips = [
                "Good time for detail-oriented work",
                "Moderate exercise",
                "Reduce processed foods",
                "Start winding down social commitments",
            ]
    else:
        phase = "Late Luteal"
        emoji = "🔴"
        description = "Period may be late or cycle is longer than average."
        tips = [
            "Track any stress that might cause delay",
            "Stay hydrated",
            "Rest and self-care",
        ]

    return {
        "phase": phase,
        "day_of_cycle": day_of_cycle,
        "description": description,
        "emoji": emoji,
        "tips": tips,
    }
def delete_cycle(db: Session, cycle_id: int, user_id : int):
    cycle = db.query(Cycle).filter