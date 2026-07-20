# For AI insight requests

from pydantic import BaseModel
from typing import Optional

# What the dropdown on the dashboard offers. Kept here so the prompt and the
# validation agree on the same wording.
RISK_LEVELS = [ "conservative", "moderate", "aggressive" ]

class InsightRequest(BaseModel) :
    risk_tolerance: Optional[str] = None   # one of RISK_LEVELS
    financial_goal: Optional[str] = None   # free text, i.e. "buy a house in 5 years"
