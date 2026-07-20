# For portfolio creation, asset creation, etc.

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime
from typing import Optional, List

class AssetCreate(BaseModel) :
    ticker: str
    shares: float
    purchase_price: float

class AssetOut(BaseModel) :
    model_config = ConfigDict( from_attributes=True )

    id: int
    ticker: str
    shares: float
    purchase_price: float
    #created_at: datetime

# The physical asset models are defined before PortfolioOut on purpose.
# PortfolioOut lists PhysicalAssetOut, and Python reads this file top to
# bottom, so the class has to already exist by the time that line runs.
class PhysicalAssetCreate(BaseModel) :
    name: str
    category: str
    make: Optional[str] = None
    model: Optional[str] = None
    year_made: Optional[int] = None
    condition: Optional[str] = None
    specs: dict = Field( default_factory=dict )
    initial_value: float
    purchase_year: int
    location: Optional[str] = None
    details: Optional[str] = None

class PhysicalAssetOut(PhysicalAssetCreate) :
    model_config = ConfigDict( from_attributes=True )

    id: int
    est_low: Optional[float] = None
    est_high: Optional[float] = None
    est_summary: Optional[str] = None
    estimated_at: Optional[datetime] = None

class PortfolioCreate(BaseModel) :
    name: str

class PortfolioOut(BaseModel) :
    # Needed so FastAPI can build this model straight from the SQLAlchemy
    # Portfolio row. Without it every portfolio response raises a
    # ValidationError asking for a dict.
    model_config = ConfigDict( from_attributes=True )

    id: int
    name: str
    created_at: datetime
    assets: List[AssetOut] = []
    physical_assets: List[PhysicalAssetOut] = []
