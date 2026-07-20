# For stock quotes and history through yFinance

from fastapi import APIRouter, Depends, HTTPException
from routes.portfolio import get_current_user_id
import yfinance as yf # unofficial API for Yahoo Finance

router = APIRouter()


@router.get( "/{ticker}" )
def get_quote( ticker: str, user_id: int = Depends( get_current_user_id ) ) :
    # yfinance is an unofficial scraper, so a bad ticker or a hiccup on Yahoo's
    # end raises rather than returning empty. Without this the endpoint 500s and
    # the dashboard shows nothing at all instead of just a missing price.
    try :
        info = yf.Ticker( ticker ).info
    except Exception :
        raise HTTPException( status_code=503, detail="Market data is unavailable right now" )

    price = info.get( "currentPrice" ) or info.get( "regularMarketPrice" )
    if not price :
        raise HTTPException( status_code=404, detail=f"No data found for ticker '{ticker}'" )

    return {
        "ticker": ticker.upper(),
        "price": price,
        "name": info.get( "shortName" ),
        "currency": info.get( "currency" ),
    }
