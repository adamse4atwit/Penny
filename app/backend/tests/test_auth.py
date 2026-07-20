# Registration, login, and token handling

def test_register_creates_user( client ) :
    res = client.post( "/auth/register", json={
        "email": "new@penny.app",
        "password": "hunter22",
        "full_name": "New User",
    } )
    assert res.status_code == 201
    body = res.json()
    assert body[ "email" ] == "new@penny.app"
    assert body[ "full_name" ] == "New User"
    # The hash should never leave the backend
    assert "hashed_password" not in body
    assert "password" not in body


def test_register_rejects_duplicate_email( client ) :
    payload = { "email": "dupe@penny.app", "password": "hunter22" }
    client.post( "/auth/register", json=payload )
    res = client.post( "/auth/register", json=payload )
    assert res.status_code == 400


def test_register_rejects_bad_email( client ) :
    res = client.post( "/auth/register", json={ "email": "not-an-email", "password": "hunter22" } )
    assert res.status_code == 422


def test_login_returns_token( client ) :
    client.post( "/auth/register", json={ "email": "login@penny.app", "password": "hunter22" } )
    res = client.post( "/auth/login", data={ "username": "login@penny.app", "password": "hunter22" } )
    assert res.status_code == 200
    body = res.json()
    assert body[ "token_type" ] == "bearer"
    assert body[ "access_token" ]


def test_login_rejects_wrong_password( client ) :
    client.post( "/auth/register", json={ "email": "wrong@penny.app", "password": "hunter22" } )
    res = client.post( "/auth/login", data={ "username": "wrong@penny.app", "password": "notmypassword" } )
    assert res.status_code == 401


def test_login_rejects_unknown_email( client ) :
    res = client.post( "/auth/login", data={ "username": "ghost@penny.app", "password": "hunter22" } )
    assert res.status_code == 401


def test_protected_route_needs_a_token( client ) :
    res = client.get( "/portfolios/" )
    assert res.status_code == 401


def test_protected_route_rejects_a_junk_token( client ) :
    res = client.get( "/portfolios/", headers={ "Authorization": "Bearer not.a.real.token" } )
    assert res.status_code == 401
