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

class UserOut(BaseModel) :
    model_config = ConfigDict( from_attributes=True )

    id: int
    email: str
    full_name: Optional[str]
    created_at: datetime
