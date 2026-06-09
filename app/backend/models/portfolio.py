# Table file for portfolios, assets, transactions, and other factors

from sqlalcehmy import Column, Integer, String, DateTime 
from sqlalchemy.orm import relationship 
from datetime import datetime 
from app.database import Base 

class Portfolio(Base) : 
    __tablename__ = "portfolios"

    id = Column( Integer, primary_key=True, index=True )
    name = Column( String, nullable=False ) 
    owner_id = Column( Integer, ForeignKey( "user.id" ), nullable=False )
    created_at = Column( DateTime, default=datetime.utcnow )

    owner = relationship( "User", back_populates="portfolios" )
    assets = relationship( "Assets", back_populates="portfolio" )

class Asset(Base) : 
    __tablename__ = "assets"

    id = Column( Integer, primary_key=True, index=True )
    ticker = Column( String, nullable=False )
    shares = Column( Float, nullable=False )
    purchase_price = Column( Integer, ForeignKey( "portfolio.id" ), nullable=False )
    created_at = Column( DateTime, default=datetime.utcnow )

    portfolio = relationship( "Portfolio", back_populates="assets" )