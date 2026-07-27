# For pydantic schemas 

from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime 
from typing import Optional 

class UserCreate(BaseModel) : 
    email: EmailStr 
    password: str 
    full_name: Optional[str] = None

class UserLogin(BaseModel) : 
    email: EmailStr 
    password: str 

class GoogleLogin(BaseModel) :
    # The one-time ID token (a JWT) that Google hands the browser after sign-in.
    credential: str

class UserOut(BaseModel) :
    model_config = ConfigDict( from_attributes=True )

    id: int
    email: str
    full_name: Optional[str]
    created_at: datetime
