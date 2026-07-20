# Portfolio and stock asset CRUD

def test_create_portfolio( auth_client ) :
    res = auth_client.post( "/portfolios/", json={ "name": "Retirement" } )
    assert res.status_code == 200
    body = res.json()
    assert body[ "name" ] == "Retirement"
    assert body[ "assets" ] == []
    assert body[ "physical_assets" ] == []


def test_list_portfolios( auth_client ) :
    auth_client.post( "/portfolios/", json={ "name": "One" } )
    auth_client.post( "/portfolios/", json={ "name": "Two" } )
    res = auth_client.get( "/portfolios/" )
    assert res.status_code == 200
    assert [ p[ "name" ] for p in res.json() ] == [ "One", "Two" ]


def test_portfolios_are_scoped_to_their_owner( client ) :
    # First user makes a portfolio
    client.post( "/auth/register", json={ "email": "a@penny.app", "password": "hunter22" } )
    login_a = client.post( "/auth/login", data={ "username": "a@penny.app", "password": "hunter22" } )
    token_a = login_a.json()[ "access_token" ]
    client.post( "/portfolios/", json={ "name": "A's money" }, headers={ "Authorization": f"Bearer {token_a}" } )

    # Second user should not see it
    client.post( "/auth/register", json={ "email": "b@penny.app", "password": "hunter22" } )
    login_b = client.post( "/auth/login", data={ "username": "b@penny.app", "password": "hunter22" } )
    token_b = login_b.json()[ "access_token" ]
    res = client.get( "/portfolios/", headers={ "Authorization": f"Bearer {token_b}" } )
    assert res.json() == []


def test_delete_portfolio( auth_client, portfolio ) :
    res = auth_client.delete( f"/portfolios/{portfolio['id']}" )
    assert res.status_code == 204
    assert auth_client.get( "/portfolios/" ).json() == []


def test_delete_missing_portfolio_is_404( auth_client ) :
    assert auth_client.delete( "/portfolios/9999" ).status_code == 404


def test_add_asset( auth_client, portfolio ) :
    res = auth_client.post( f"/portfolios/{portfolio['id']}/assets", json={
        "ticker": "AAPL",
        "shares": 10,
        "purchase_price": 150.25,
    } )
    assert res.status_code == 200
    body = res.json()
    assert body[ "ticker" ] == "AAPL"
    assert body[ "shares" ] == 10
    assert body[ "purchase_price" ] == 150.25


def test_added_asset_shows_up_on_the_portfolio( auth_client, portfolio ) :
    auth_client.post( f"/portfolios/{portfolio['id']}/assets", json={
        "ticker": "IVV", "shares": 3, "purchase_price": 400.0,
    } )
    listed = auth_client.get( "/portfolios/" ).json()
    assert [ a[ "ticker" ] for a in listed[0][ "assets" ] ] == [ "IVV" ]


def test_add_asset_to_missing_portfolio_is_404( auth_client ) :
    res = auth_client.post( "/portfolios/9999/assets", json={
        "ticker": "AAPL", "shares": 1, "purchase_price": 100.0,
    } )
    assert res.status_code == 404


def test_delete_asset( auth_client, portfolio ) :
    added = auth_client.post( f"/portfolios/{portfolio['id']}/assets", json={
        "ticker": "MSFT", "shares": 5, "purchase_price": 300.0,
    } ).json()
    res = auth_client.delete( f"/portfolios/{portfolio['id']}/assets/{added['id']}" )
    assert res.status_code == 204
    assert auth_client.get( "/portfolios/" ).json()[0][ "assets" ] == []


def test_delete_missing_asset_is_404( auth_client, portfolio ) :
    assert auth_client.delete( f"/portfolios/{portfolio['id']}/assets/9999" ).status_code == 404
