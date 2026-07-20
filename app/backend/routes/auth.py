# Authenication for user registrations, login, etc.

from fastapi import APIRouter, Depends, HTTPException, status 
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session 
from app.database import get_db 
from models.user import User 
from schemas.user import UserCreate, UserLogin, UserOut 
from app.config import settings 
from passlib.context import CryptContext
from jose import jwt
from app.utils import utc_now
from datetime import timedelta

router = APIRouter() 
pwd_context = CryptContext( schemes=[ "bcrypt" ], deprecated="auto" )

def hash_password( password: str ) -> str :
    return pwd_context.hash( password )

def verify_password( plain: str, hashed: str ) -> bool :
    return pwd_context.verify( plain, hashed )

def create_access_token( data: dict ) -> str :
    to_encode = data.copy()
    # Read the lifetime and algorithm from settings instead of hardcoding them,
    # so changing .env actually takes effect
    expire = utc_now() + timedelta( minutes=settings.access_token_expire_minutes )
    to_encode.update( {"exp": expire } )
    return jwt.encode ( to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm )

# User regristration
@router.post( "/register", response_model=UserOut, status_code=status.HTTP_201_CREATED )
def register( user: UserCreate, db: Session = Depends( get_db ) ) : 
    existing = db.query( User ).filter( User.email == user.email ).first() 
    if existing : 
        raise HTTPException( status_code=400, detail="email already registered" )
    new_user = User( email=user.email, hashed_password=hash_password( user.password ), full_name=user.full_name, )
    
    db.add( new_user )
    db.commit() 
    db.refresh( new_user ) 
    return new_user 

# User login
@router.post( "/login" )
def login( form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends( get_db ) ) : 
    db_user = db.query( User ).filter( User.email == form.username ).first() 
    if not db_user or not verify_password( form.password, db_user.hashed_password ): 
        raise HTTPException( status_code=401, detail="Invalid credentials" )
    token = create_access_token( {"sub": str( db_user.id) } )
    return { "access_token": token, "token_type": "bearer" }


