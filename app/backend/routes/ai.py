# AI recommendation feature - portfolio-aware insight via OpenClaw Gateway

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from models.portfolio import Portfolio
from routes.portfolio import get_current_user_id
import yfinance as yf
import httpx

router = APIRouter()


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
    prompt = (
        "You are Penny, a helpful financial assistant for a student investor. "
        "Given the portfolio below, give a short, plain-language recommendation (4-6 sentences). "
        "Comment on diversification, any concentration risk, and one or two concrete suggestions. "
        "This is educational, not professional financial advice.\n\n"
        f"Portfolio holdings:\n{holdings}"
    )

    payload = {
        "model": settings.ai_model,
        "max_tokens": 600,
        "messages": [ {"role": "user", "content": prompt} ],
    }

    headers = {
        "Authorization": f"Bearer {settings.openclaw_api_key}",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client() as client :
            response = client.post(
                f"{settings.openclaw_base_url}/api/messages",
                json=payload,
                headers=headers,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            text = data["content"][0]["text"]
    except httpx.HTTPStatusError as e:
        raise HTTPException( status_code=502, detail=f"OpenClaw API error: {e.response.status_code} - {e.response.text}" )
    except Exception as e:
        raise HTTPException( status_code=502, detail=f"AI service error: {e}" )

    return {"recommendation": text}
