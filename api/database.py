import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from .models import Base

# Database Configuration
IS_VERCEL = "VERCEL" in os.environ

if IS_VERCEL:
    # On Vercel, the filesystem is read-only except for /tmp
    DB_PATH = "/tmp/dlra_audit.db"
else:
    # Local SQLite Database Path
    DB_PATH = os.path.join(os.path.dirname(__file__), "dlra_audit.db")

DATABASE_URL = f"sqlite:///{DB_PATH}"

# Create Engine and Session
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} # Required for SQLite with FastAPI
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes the SQLite database with all tables defined in models.py"""
    Base.metadata.create_all(bind=engine)
    print(f"[*] SQLite Database initialized at: {DB_PATH}")

# Legacy support for supabase variable 
# (we will migrate all usages, but defining a placeholder here to avoid immediate crashes)
supabase = None 
