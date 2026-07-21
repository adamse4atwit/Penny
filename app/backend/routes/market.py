# For stock quotes and history through yFinance

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from routes.portfolio import get_current_user_id
import yfinance as yf # unofficial API for Yahoo Finance

router = APIRouter()


# Declared before "/{ticker}" on purpose: FastAPI matches routes in the order
# they're registered, so the other way round a request for /market/search would
# be read as a quote for a company called "search".
@router.get( "/search" )
def search_symbols( q: str, user_id: int = Depends( get_current_user_id ) ) :
    # Lets someone type "apple" instead of having to already know it's AAPL.
    query = q.strip()
    if len( query ) < 2 :
        return []

    try :
        quotes = yf.Search( query, max_results=10 ).quotes
    except Exception :
        raise HTTPException( status_code=503, detail="Market data is unavailable right now" )

    results = []
    for quote in quotes :
        # Yahoo mixes currencies, futures and options into the same result list,
        # and returns the same company listed on a dozen foreign exchanges. Only
        # ordinary shares and funds priced in USD are things this app can chart.
        if quote.get( "quoteType" ) not in ( "EQUITY", "ETF" ) :
            continue
        if quote.get( "exchange" ) not in ( "NMS", "NYQ", "NGM", "ASE", "PCX", "BTS", "NCM" ) :
            continue

        results.append( {
            "ticker" : quote.get( "symbol" ),
            "name" : quote.get( "longname" ) or quote.get( "shortname" ),
            "exchange" : quote.get( "exchDisp" ),
        } )

    return results[ :6 ]


@router.get( "/{ticker}/history" )
def get_price_on_date( ticker: str, on: date, user_id: int = Depends( get_current_user_id ) ) :
    # What a share closed at on the day someone bought it, so they don't have to
    # dig through an old brokerage statement to fill the form in.
    if on > date.today() :
        raise HTTPException( status_code=400, detail="That date hasn't happened yet" )

    # Markets close at weekends and holidays, so asking for one exact day often
    # returns nothing at all. Reaching back a week and taking the last row gives
    # the most recent day that actually traded, which is the price that was on
    # the screen when they placed the order anyway.
    try :
        frame = yf.Ticker( ticker ).history(
            start=( on - timedelta( days=7 ) ).isoformat(),
            end=( on + timedelta( days=1 ) ).isoformat(),
        )
    except Exception :
        raise HTTPException( status_code=503, detail="Market data is unavailable right now" )

    if frame.empty :
        raise HTTPException(
            status_code=404,
            detail=f"No price found for '{ticker.upper()}' around {on.isoformat()}",
        )

    traded_on = frame.index[ -1 ].date()

    return {
        "ticker" : ticker.upper(),
        "price" : round( float( frame[ "Close" ].iloc[ -1 ] ), 2 ),
        "date" : traded_on.isoformat(),
        # The frontend says "we used the 3rd, the 5th was a Saturday" when these
        # differ, rather than quietly answering a question nobody asked.
        "requested" : on.isoformat(),
    }


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
