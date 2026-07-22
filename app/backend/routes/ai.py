# AI recommendation feature - portfolio-aware insight via OpenClaw Gateway

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from models.portfolio import Portfolio, PhysicalAsset
from schemas.ai import InsightRequest, RISK_LEVELS
from routes.portfolio import get_current_user_id
from app.utils import utc_now
import yfinance as yf
import anthropic 

router = APIRouter()

client = anthropic.Anthropic( 
    api_key=settings.anthropic_api_key, 
    base_url=settings.anthropic_base_url,
)

insight_prompt = (
    "You are Penny, a helpful financial assistant for a regular investor. "
    "Look at everything the user owns, both stocks and physical items like cars, homes, and jewelry, "
    "and give a short, plain-language read on their overall picture. "
    "Comment on diversification and any concentration risk, then give one or two concrete next steps. "
    "Always call the report_insight tool. Keep every field short and write in plain sentences with no "
    "markdown at all: no asterisks, no headers, no bullet characters. The app formats it for you. "
    "This is mainly educational but acts as an insightful and professional assistant."
)
# Structured output, same idea as estimate_tool below. Asking for fields instead of
# free text means the dashboard can lay it out itself, so no raw markdown reaches the page.
insight_tool = {
    "name": "report_insight",
    "description": "Report a plain-language read on the user's portfolio.",
    "input_schema": {
        "type": "object",
        "properties": {
            "headline": { "type": "string", "description": "One sentence summing up the portfolio." },
            "observations": {
                "type": "array",
                "description": "Two or three things worth pointing out, like concentration or diversification.",
                "items": {
                    "type": "object",
                    "properties": {
                        "label": { "type": "string", "description": "A few words naming the observation." },
                        "detail": { "type": "string", "description": "One or two sentences explaining it." },
                    },
                    "required": [ "label", "detail" ],
                },
            },
            "suggestions": {
                "type": "array",
                "description": "One or two concrete next steps the user could take.",
                "items": {
                    "type": "object",
                    "properties": {
                        "action": { "type": "string", "description": "The step, stated plainly." },
                        "why": { "type": "string", "description": "One sentence on why it helps." },
                    },
                    "required": [ "action", "why" ],
                },
            },
        },
        "required": [ "headline", "observations", "suggestions" ],
    },
}
estimate_prompt = (
    "You are Penny, a helpful assistant that estimates the current resale value of physical assets "
    "like homes, cars, boats, jewelry, and equipment. Use the details given to reason about age, "
    "depreciation or appreciation, condition, and location. Always call the report_estimate tool. "
    "Your range should be a realistic private-party resale range in USD, not an insurance or retail price. "
    "In the summary, make clear this is a rough estimate and not a professional appraisal."
)
estimate_tool = { 
    "name": "report_estimate",
    "description": "Report the estimated current resale value of a physical asset.",
    "input_schema": {
        "type": "object",
        "properties": {
            "low": { "type": "number", "description": "Low end of the resale range, in USD." },
            "high": { "type": "number", "description": "High end of the resale range, in USD." },
            "summary": { "type": "string", "description": "2-4 sentences on the main factors driving the value." },
        },
        "required": [ "low", "high", "summary" ],
    },
}


def current_price( ticker: str ) :
    try:
        info = yf.Ticker(ticker).info
        return info.get( "currentPrice" ) or info.get( "regularMarketPrice" )
    except Exception:
        return None
    
def describe_asset( asset ) :
    lines = [
        f"Category: {asset.category}",
        f"Name: {asset.name}",
        f"Make: {asset.make or 'not given'}",
        f"Model: {asset.model or 'not given'}",
        f"Model year: {asset.year_made or 'not given'}",
        f"Condition: {asset.condition or 'not given'}",
        f"Purchase price: ${asset.initial_value:,.2f}, bought in {asset.purchase_year}",
        f"Location: {asset.location or 'not given'}",
    ]
    # category specific fields, i.e. mileage for a car or square feet for a house
    for key, value in ( asset.specs or {} ).items() :
        # A multi-select spec arrives as a list, i.e. a house's upgrades. Joined
        # into a phrase so the prompt reads as prose rather than showing Penny
        # a Python list, and skipped entirely when nothing was ticked.
        if isinstance( value, list ) :
            value = ", ".join( str( v ) for v in value )
        if value not in ( None, "" ) :
            lines.append( f"{key.replace('_', ' ').capitalize()}: {value}" )
    if asset.details :
        lines.append( f"Notes: {asset.details}" )
    return "\n".join( lines )


# Worth of a physical item right now: the middle of Penny's estimate range if we
# have one, otherwise what the user paid. Matches currentValue() on the frontend.
def item_value( item ) :
    if item.est_low is not None and item.est_high is not None :
        return ( item.est_low + item.est_high ) / 2
    return item.initial_value

# Plain-text summary of everything the user owns, stocks and items alike, so the
# insight covers the whole picture instead of just the stock side.
def describe_holdings( portfolios ) :
    lines = []
    total = 0.0

    for p in portfolios :
        for a in p.assets :
            price = current_price( a.ticker )
            value = ( price or a.purchase_price ) * a.shares
            total += value
            price_str = f"${price:.2f}" if price else "unavailable"
            lines.append(
                f"- {a.ticker} (stock): {a.shares} shares, bought at ${a.purchase_price:.2f}, "
                f"current {price_str}, worth about ${value:,.2f}"
            )
        for item in p.physical_assets :
            value = item_value( item )
            total += value
            estimated = "Penny estimated" if item.est_low is not None else "not yet estimated, using purchase price"
            lines.append(
                f"- {item.name} ({item.category}): bought {item.purchase_year} for ${item.initial_value:,.2f}, "
                f"worth about ${value:,.2f} ({estimated})"
            )

    return lines, total


@router.post( "/recommendations" )
def get_recommendation(
    body: InsightRequest | None = None,
    db: Session = Depends( get_db ),
    user_id: int = Depends( get_current_user_id ),
) :
    body = body or InsightRequest()

    if body.risk_tolerance and body.risk_tolerance not in RISK_LEVELS :
        raise HTTPException( status_code=422, detail=f"risk_tolerance must be one of {RISK_LEVELS}" )

    portfolios = db.query( Portfolio ).filter( Portfolio.owner_id == user_id ).all()

    lines, total = describe_holdings( portfolios )

    if not lines :
        return {
            "headline": "Add some assets to your portfolio to start and I'll help give some advice.",
            "observations": [],
            "suggestions": [],
        }

    holdings = "\n".join( lines )

    # Only mention what the user actually filled in, so a blank field doesn't
    # turn into Penny guessing at a goal they never gave.
    about_me = []
    if body.risk_tolerance :
        about_me.append( f"My risk tolerance is {body.risk_tolerance}." )
    if body.financial_goal :
        about_me.append( f"My financial goal: {body.financial_goal}" )

    question = f"Everything I own (total about ${total:,.2f}):\n{holdings}"
    if about_me :
        question += "\n\n" + "\n".join( about_me ) + "\nTailor the advice to that."

    try:
        response = client.messages.create(
            model=settings.ai_model,
            max_tokens=1000,
            system=insight_prompt,
            tools=[ insight_tool ],
            tool_choice={ "type": "tool", "name": "report_insight" },
            messages=[
                { "role": "user", "content": question }
            ],
        )
    except anthropic.APIStatusError as e :
        raise HTTPException( status_code=502, detail=f"Claude API error: {e.status_code} - {e.message}" )
    except anthropic.APIConnectionError :
        raise HTTPException( status_code=502, detail="Could not reach the Claude API" )

    block = next( ( b for b in response.content if b.type == "tool_use" ), None )
    if not block :
        raise HTTPException( status_code=502, detail="Penny could not put together an insight" )

    return block.input
    
# physical assets
@router.post( "/estimate/{asset_id}" )
def estimate_asset( asset_id: int, db: Session = Depends( get_db ), user_id: int = Depends( get_current_user_id ) ) :
    asset = (
        db.query( PhysicalAsset )
        .join( Portfolio )
        .filter( PhysicalAsset.id == asset_id, Portfolio.owner_id == user_id )
        .first()
    )
    if not asset :
        raise HTTPException( status_code=404, detail="Asset not found" )
    
    try:
        response = client.messages.create(
            model=settings.ai_model,
            max_tokens=600,
            system=estimate_prompt,
            tools=[ estimate_tool ],
            tool_choice={ "type": "tool", "name": "report_estimate" },
            messages=[ { "role": "user", "content": describe_asset( asset ) } ],
        )
    except anthropic.APIStatusError as e :
        raise HTTPException( status_code=502, detail=f"Claude API error: {e.status_code} - {e.message}" )
    except anthropic.APIConnectionError :
        raise HTTPException( status_code=502, detail="Could not reach the Claude API" )

    block = next( ( b for b in response.content if b.type == "tool_use" ), None )
    if not block : 
        raise HTTPException( status_code=502, detail="Penny could not come up with an estimate" )
    
    asset.est_low = float( block.input[ "low" ] )
    asset.est_high = float( block.input[ "high" ] )
    asset.est_summary = block.input[ "summary" ]
    asset.estimated_at = utc_now()
    db.commit() 
    db.refresh( asset )
    return asset 