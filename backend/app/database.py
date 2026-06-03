import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load .env file into os.environ
load_dotenv()

# Read the connection string we set in .env
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Check your .env file.")

# The Engine: app-wide connection pool manager
engine = create_engine(DATABASE_URL, echo=False)

# SessionLocal: a factory. Calling SessionLocal() gives a new session.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base: the parent class for all ORM models we'll define later
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that provides a database session per request,
    and guarantees it's closed afterward — even on errors.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()