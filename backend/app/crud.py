from sqlalchemy.orm import Session
from app.models import User
from app.schemas import UserCreate
from app.auth import hash_password
from typing import List
from datetime import timedelta
from app.models import Cycle
from app.schemas import CycleCreate



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
    db_cycle = Cycle(
        user_id=user_id,
        start_date=cycle.start_date,
        end_date=cycle.end_date,
        notes=cycle.notes,
    )
    db.add(db_cycle)
    db.commit()
    db.refresh(db_cycle)
    return db_cycle


def get_user_cycles(db: Session, user_id: int) -> List[Cycle]:
    """Fetch all cycles for a specific user, newest first."""
    return (
        db.query(Cycle)
        .filter(Cycle.user_id == user_id)
        .order_by(Cycle.start_date.desc())
        .all()
    )


def predict_next_cycle(db: Session, user_id: int):
    """Predict next period using moving average of last 3 cycle lengths."""
    cycles = (
        db.query(Cycle)
        .filter(Cycle.user_id == user_id)
        .order_by(Cycle.start_date.desc())
        .limit(4)  # need 4 to compute 3 gaps
        .all()
    )

    if len(cycles) < 2:
        return {
            "predicted_next_start": None,
            "average_cycle_length_days": None,
            "cycles_used_for_prediction": len(cycles),
            "confidence": "low",
        }

    # Compute gaps between consecutive cycles (in days)
    cycles_oldest_first = list(reversed(cycles))
    gaps = []
    for i in range(1, len(cycles_oldest_first)):
        delta = cycles_oldest_first[i].start_date - cycles_oldest_first[i - 1].start_date
        gaps.append(delta.days)

    avg_gap = sum(gaps) / len(gaps)
    last_start = cycles[0].start_date
    predicted = last_start + timedelta(days=avg_gap)

    confidence = "high" if len(gaps) >= 3 else "medium"

    return {
        "predicted_next_start": predicted,
        "average_cycle_length_days": round(avg_gap, 1),
        "cycles_used_for_prediction": len(gaps),
        "confidence": confidence,
    }