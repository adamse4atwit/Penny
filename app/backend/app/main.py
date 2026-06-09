# For FASTAPI app, CORS, and router registration

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine 
import models.user, models.portfolio
from routes.api import router



Base.metadata.create_all( bind=engine )

app = FastAPI( title="Penny API" )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ "http://localhost:5173" ],
    allow_credentials=True,
    allow_methods=[ "*" ],
    allow_headers=[ "*" ],
)

app.include_router( router )
