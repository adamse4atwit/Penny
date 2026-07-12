# AI recommendation feature - portfolio-aware insight via OpenClaw Gateway

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from models.portfolio import Portfolio
from routes.portfolio import get_current_user_id
import yfinance as yf
import anthropic 

router = APIRouter()

client = anthropic.Anthropic( 
    api_key=settings.anthropic_api_key, 
    base_url=settings.anthropic_base_url,
)

system_prompt = ( 
    "You are Penny, a helpful financial assistant for an regular investor."
    "Given a portfolio, give a short, plain-language recommendation (4-5 sentences)."
    "Comment on diversification, any concentration risks, and one or two concrete suggestions for improvement."
    "This is mainly educational but acts as an insightful and professional assistant."
)

def current_price( ticker: str ) :
    try:
        info = yf.Ticker(ticker).info
        return info.get( "currentPrice" ) or info.get( "regularMarketPrice" )
    except Exception:
        return None


@router.post( "/recommendations" )
def get_recommendation( db: Session = Depends( get_db ), user_id: int = Depends( get_current_user_id) ) :
    portfolios = db.query( Portfolio ).filter( Portfolio.owner_id == user_id ).all()

    # Build a plain-text summary of everything the user holds
    lines = []
    for p in portfolios :
        for a in p.assets :
            price = current_price( a.ticker )
            price_str = f"${price:.2f}" if price else "unavailable"
            lines.append( f"- {a.ticker}: {a.shares} shares, bought at ${a.purchase_price:.2f}, current {price_str}" )

    if not lines :
        return { "recommendation": "Add some assets to your portfolio to start. I'll help give some advice." }

    holdings = "\n".join( lines )

    try: 
        response = client.messages.create( 
            model=settings.ai_model, 
            max_tokens=600, 
            system=system_prompt, 
            messages=[ 
                { "role": "user", "content": f"Portfolio holdings:\n{holdings}" }
            ],
        )
        text = next( ( block.text for block in response.content if block.type == "text" ), "" )
    except anthropic.APIStatusError as e : 
        raise HTTPException( status_code=502, detail=f"Claude API error: {e.status_code} - {e.message}" )
    except anthropic.APIConnectionError : 
        raise HTTPException( status_code=502, detail="Could not reach the Claude API" )
    
    return { "recommendation": text }