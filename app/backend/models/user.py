# For user data table file

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils import utc_now

class User(Base) : 
    __tablename__ = "users"

    id = Column( Integer, primary_key=True, index=True )
    email = Column( String, unique=True, index=True, nullable=False )
    hashed_password = Column( String, nullable=False )
    full_name = Column( String, nullable=True )
    created_at = Column( DateTime, default=utc_now )

    portfolios = relationship( "Portfolio", back_populates="owner" )