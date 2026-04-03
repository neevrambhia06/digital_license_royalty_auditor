import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from models import Base

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database Configuration
IS_VERCEL = "VERCEL" in os.environ

if IS_VERCEL:
    # On Vercel, the filesystem is read-only except for /tmp
    # Ensure we use an absolute path for /tmp to avoid any ambiguity
    DB_PATH = os.path.abspath("/tmp/dlra_audit.db")
else:
    # Local SQLite Database Path
    DB_PATH = os.path.join(os.path.dirname(__file__), "dlra_audit.db")

DATABASE_URL = f"sqlite:///{DB_PATH}"

# Create Engine
# Note: create_engine() itself doesn't connect to the DB until first use.
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
    try:
        # Check if we can actually connect and write
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        Base.metadata.create_all(bind=engine)
        logger.info(f"[*] SQLite Database initialized at: {DB_PATH}")
    except Exception as e:
        logger.error(f"[!] Database initialization failed: {str(e)}")
        raise
