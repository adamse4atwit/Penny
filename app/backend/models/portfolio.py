# Table file for portfolios, assets, transactions, and other factors

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship 
from datetime import datetime 
from app.database import Base 

class Portfolio(Base) : 
    __tablename__ = "portfolios"

    id = Column( Integer, primary_key=True, index=True )
    name = Column( String, nullable=False ) 
    owner_id = Column( Integer, ForeignKey( "users.id" ), nullable=False )
    created_at = Column( DateTime, default=datetime.utcnow )

    owner = relationship( "User", back_populates="portfolios" )
    assets= relationship( "Asset", back_populates="portfolio", cascade="all, delete-orphan" )
    physical_assets = relationship( "PhysicalAsset", back_populates="portfolio", cascade="all, delete-orphan" )

class Asset(Base) :
    __tablename__ = "assets"

    id = Column( Integer, primary_key=True, index=True )
    ticker = Column( String, nullable=False )
    shares = Column( Float, nullable=False )
    purchase_price = Column( Float, nullable=False )
    #created_at = Column( DateTime, default=datetime.utcnow )
    portfolio_id = Column( Integer, ForeignKey( "portfolios.id" ), nullable=False )


    portfolio = relationship( "Portfolio", back_populates="assets" )

class PhysicalAsset(Base) :
    __tablename__ = "physical_assets"

    id = Column( Integer, primary_key=True, index=True )
    name = Column( String, nullable=False )
    category = Column( String, nullable=False )        # house, car, boat, property, other
    initial_value = Column( Float, nullable=False )    # purchase price
    purchase_year = Column( Integer, nullable=False )
    location = Column( String, nullable=True )
    details = Column( String, nullable=True )          # free text: mileage, condition, upgrades
    portfolio_id = Column( Integer, ForeignKey( "portfolios.id" ), nullable=False )

    portfolio = relationship( "Portfolio", back_populates="physical_assets" )
   
