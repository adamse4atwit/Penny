# For portfolio creation, asset creation, etc.

from pydantic import BaseModel, EmailStr 
from datetime import datetime 
from typing import Optional, List 

class AssetCreate(BaseModel) : 
    ticker: str 
    shares: float 
    purchase_price: float 

class AssetOut(BaseModel) : 
    id: int 
    ticker: str 
    shares: float 
    purchase_price: float 
    #created_at: datetime 

    class Config: 
        from_attributes = True 

class PortfolioCreate(BaseModel) : 
    name: str 

class PortfolioOut(BaseModel) : 
    id: int 
    name: str 
    created_at: datetime 
    assets: List[AssetOut] = [] 
    physical_assets: List[PhysicalAssetOut] = []

class PhysicalAssetCreate(BaseModel) :
    name: str
    category: str
    initial_value: float
    purchase_year: int
    location: Optional[str] = None
    details: Optional[str] = None

class PhysicalAssetOut(BaseModel) :
    id: int
    name: str
    category: str
    initial_value: float
    purchase_year: int
    location: Optional[str] = None
    details: Optional[str] = None

    class Config : 
        from_attributes = True 
