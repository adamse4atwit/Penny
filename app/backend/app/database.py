# For SQLAlchemy engine, SessionLocal, and Base

from sqlalchemy import create_engine 
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings 

# SQLite, which the test suite uses, refuses a connection opened on one thread
# and reused on another. Postgres doesn't take this argument at all.
connect_args = { "check_same_thread": False } if settings.database_url.startswith( "sqlite" ) else {}

engine = create_engine( settings.database_url, connect_args=connect_args )
SessionLocal = sessionmaker( autocommit=False, autoflush=False, bind=engine )

class Base( DeclarativeBase ) : 
    pass 

def get_db() : 
    db = SessionLocal() 
    try : 
        yield db 
    finally : 
        db.close() 