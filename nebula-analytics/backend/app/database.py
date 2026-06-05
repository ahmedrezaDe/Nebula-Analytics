from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models import Base

# Using the modern psycopg driver we updated for Mac compatibility
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initializes the database tables based on our models."""
    # In a production app, we would use Alembic migrations. 
    # For this MVP, we will auto-generate the schema.
    Base.metadata.create_all(bind=engine)

def get_db():
    """Dependency for FastAPI endpoints to get a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()