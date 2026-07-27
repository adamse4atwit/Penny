# Authenication for user registrations, login, etc.

from fastapi import APIRouter, Depends, HTTPException, status 
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session 
from app.database import get_db 
from models.user import User 
from schemas.user import UserCreate, UserLogin, UserOut, GoogleLogin
from app.config import settings
from passlib.context import CryptContext
from jose import jwt
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from app.utils import utc_now
from datetime import timedelta
import secrets

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

# Sign in / sign up with Google
@router.post( "/google" )
def google_login( payload: GoogleLogin, db: Session = Depends( get_db ) ) :
    # Never trust the token the browser sends. verify_oauth2_token checks Google's
    # signature, the expiry, and that the audience matches our own client ID.
    try :
        claims = google_id_token.verify_oauth2_token(
            payload.credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except ValueError :
        raise HTTPException( status_code=401, detail="Invalid Google token" )

    email = claims.get( "email" )
    if not email or not claims.get( "email_verified" ) :
        raise HTTPException( status_code=401, detail="Google account has no verified email" )

    return issue_token_for_oauth_user( db, email, claims.get( "name" ) )

# Tail of the Google login: find the account or make one, then hand back the
# same bearer token /login returns.
def issue_token_for_oauth_user( db: Session, email: str, full_name: str | None ) -> dict :
    # Match on email so someone who registered with a password can also use the
    # Google button later and land in the same account.
    db_user = db.query( User ).filter( User.email == email ).first()
    if not db_user :
        # hashed_password is NOT NULL, and social users don't have one, so store
        # a hash of random bytes nobody knows. That makes /login unusable for
        # them without needing a schema change.
        db_user = User(
            email=email,
            hashed_password=hash_password( secrets.token_urlsafe( 32 ) ),
            full_name=full_name,
        )
        db.add( db_user )
        db.commit()
        db.refresh( db_user )

    token = create_access_token( { "sub": str( db_user.id ) } )
    return { "access_token": token, "token_type": "bearer" }


