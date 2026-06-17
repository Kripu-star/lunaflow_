import os
from groq import Groq
from sqlalchemy.orm import Session
from app import crud
from app.models import User

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

PERSONAS = {
    "doctor": """You are Dr. Luna, a compassionate women's health physician 
specializing in menstrual health and hormonal wellness. You give clear, 
evidence-based medical guidance while being warm and non-judgmental. 
Always recommend consulting a real doctor for serious concerns.
Never diagnose conditions. Focus on education, lifestyle, and wellness.""",

    "parent": """You are a caring, experienced parent figure who deeply 
understands women's health. You give nurturing, practical advice like 
a supportive mother would — warm, reassuring, and grounded in lived 
experience. Balance emotional support with practical suggestions.""",

    "partner": """You are a supportive, understanding partner who wants 
to help. You're empathetic, patient, and focused on emotional support 
first. Offer gentle practical suggestions when asked, but mostly 
listen, validate feelings, and encourage self-care.""",
}


def build_system_prompt(persona: str, user: User, db: Session) -> str:
    user_id = int(user.id)  # type: ignore
    cycles = crud.get_user_cycles(db, user_id=user_id)
    mood_stats = crud.get_mood_stats(db, user_id=user_id)
    prediction = crud.predict_next_cycle(db, user_id=user_id)
    recent_moods = crud.get_user_moods(db, user_id=user_id, limit=3)

    cycle_context = "No cycle data logged yet."
    if cycles:
        last_cycle = cycles[0]
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        last_start = last_cycle.start_date
        if last_start.tzinfo is None:
            last_start = last_start.replace(tzinfo=timezone.utc)
        days_since = (now - last_start).days
        cycle_context = f"Last period started {days_since} days ago."
        if prediction.get("predicted_next_start"):
            pred_date = prediction["predicted_next_start"]
            if hasattr(pred_date, "tzinfo") and pred_date.tzinfo is None:
                pred_date = pred_date.replace(tzinfo=timezone.utc)
            days_until = (pred_date - now).days
            cycle_context += f" Next period predicted in {days_until} days."
            cycle_context += f" Average cycle: {prediction.get('average_cycle_length_days')} days."

    mood_context = "No mood data available."
    if mood_stats.get("total_entries", 0) > 0:
        mood_context = (
            f"Average mood: {mood_stats.get('average_mood')}/5. "
            f"Trend: {mood_stats.get('recent_trend')}. "
            f"Average energy: {mood_stats.get('average_energy')}/5."
        )
        if recent_moods:
            latest = recent_moods[0]
            mood_context += f" Latest mood: {latest.mood_score}/5"
            if latest.note:
                mood_context += f" ('{latest.note}')"

    persona_prompt = PERSONAS.get(persona, PERSONAS["doctor"])
    name = user.full_name or str(user.email).split("@")[0]

    return f"""{persona_prompt}

USER HEALTH CONTEXT:
- {cycle_context}
- {mood_context}
- User's name: {name}

BEHAVIORAL RULES:
- Personalize every response using the health context above
- Period due within 5 days: mention rest, iron-rich foods, gentle yoga
- Declining mood trend: lead with emotional support
- Energy below 3: suggest restorative activities only
- Nutrition: suggest vegetarian options first
- Keep responses under 150 words unless user asks for more
- Always be warm, never clinical"""


def chat_with_gemini(
    persona: str,
    message: str,
    history: list,
    user: User,
    db: Session,
) -> str:
    system_prompt = build_system_prompt(persona, user, db)

    messages = [{"role": "system", "content": system_prompt}]

    for msg in history[-10:]:
        role = "user" if msg["role"] == "user" else "assistant"
        messages.append({"role": role, "content": msg["content"]})

    messages.append({"role": "user", "content": message})

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=300,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"I'm having trouble connecting right now. Please try again. (Error: {str(e)})"