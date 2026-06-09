# Router that includes sub-routers 

from fastapi import APIRouter
from routes import auth, portfolio, market

router = APIRouter()

router.include_router( auth.router, prefix="/auth", tags=[ "auth" ] )
router.include_router( portfolio.router, prefix="/portfolios", tags=[ "portfolios" ] )
router.include_router( market.router, prefix="/market", tags=[ "market" ] )
