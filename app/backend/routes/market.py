# For stock quotes and history through yFinance 

from fastapi import APIRouter, HTTPException
import yfinance as yf # unofficial API for Yahoo Finance 

router = APIRouter()


@router.get( "/{ticker}" )
def get_quote( ticker: str ) :
    stock = yf.Ticker( ticker )
    info = stock.info
    price = info.get( "currentPrice" ) or info.get( "regularMarketPrice" )
    if not price :
        raise HTTPException( status_code=404, detail=f"No data found for ticker '{ticker}'" )
    return {
        "ticker": ticker.upper(),
        "price": price,
        "name": info.get( "shortName" ),
        "currency": info.get( "currency" ),
    }
