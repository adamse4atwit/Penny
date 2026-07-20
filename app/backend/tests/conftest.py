# Shared pytest setup.
#
# Points the app at a throwaway SQLite file so the tests never touch the real
# Postgres database. This has to happen before anything imports app.database,
# because the engine is built from settings at import time. Environment
# variables outrank the .env file in pydantic-settings, so setting them here wins.

import os
import tempfile

TEST_DB = os.path.join( tempfile.gettempdir(), "penny_test.db" )
os.environ[ "DATABASE_URL" ] = f"sqlite:///{TEST_DB}"
os.environ.setdefault( "JWT_SECRET_KEY", "test-secret-not-a-real-key" )
os.environ.setdefault( "ANTHROPIC_API_KEY", "test-key-never-called" )

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


@pytest.fixture
def client() :
    # Rebuild the schema per test so one test's user can't collide with another's
    Base.metadata.drop_all( bind=engine )
    Base.metadata.create_all( bind=engine )
    with TestClient( app ) as test_client :
        yield test_client


@pytest.fixture
def auth_client( client ) :
    # A client that has already registered and logged in, with the bearer token
    # attached. Saves every protected-route test from repeating the same setup.
    client.post( "/auth/register", json={
        "email": "test@penny.app",
        "password": "hunter22",
        "full_name": "Test User",
    } )
    res = client.post( "/auth/login", data={
        "username": "test@penny.app",
        "password": "hunter22",
    } )
    token = res.json()[ "access_token" ]
    client.headers.update( { "Authorization": f"Bearer {token}" } )
    return client


@pytest.fixture
def portfolio( auth_client ) :
    # A portfolio to hang assets off of, since most CRUD tests need one first.
    res = auth_client.post( "/portfolios/", json={ "name": "Test Portfolio" } )
    return res.json()
