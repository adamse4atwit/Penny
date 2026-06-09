# For portfolio CRUD

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from models.portfolio import Portfolio, Asset
from schemas.portfolio import PortfolioCreate, PortfolioOut, AssetCreate, AssetOut
from routes.auth import create_access_token
from jose import jwt, JWTError
from app.config import settings
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer( tokenUrl="/auth/login" )


def get_current_user_id( token: str = Depends( oauth2_scheme ) ) -> int :
    try:
        payload = jwt.decode( token, settings.jwt_secret_key, algorithms=["HS256"] )
        return int( payload.get( "sub" ) )
    except JWTError :
        raise HTTPException( status_code=401, detail="Invalid token" )


@router.post( "/", response_model=PortfolioOut )
def create_portfolio( portfolio: PortfolioCreate, db: Session = Depends( get_db ), user_id: int = Depends( get_current_user_id ) ) :
    new_portfolio = Portfolio(name=portfolio.name, owner_id=user_id)
    db.add( new_portfolio )
    db.commit()
    db.refresh( new_portfolio )
    return new_portfolio


@router.get( "/", response_model=list[ PortfolioOut ] )
def get_portfolios( db: Session = Depends( get_db ), user_id: int = Depends( get_current_user_id ) ) :
    return db.query( Portfolio ).filter( Portfolio.owner_id == user_id ).all()


@router.post( "/{portfolio_id}/assets", response_model=AssetOut )
def add_asset( portfolio_id: int, asset: AssetCreate, db: Session = Depends( get_db ), user_id: int = Depends( get_current_user_id ) ) :
    portfolio = db.query( Portfolio ).filter( Portfolio.id == portfolio_id, Portfolio.owner_id == user_id ).first()
    if not portfolio:
        raise HTTPException( status_code=404, detail="Portfolio not found" )
    new_asset = Asset( **asset.model_dump(), portfolio_id=portfolio_id )
    db.add( new_asset )
    db.commit()
    db.refresh( new_asset )
    return new_asset
