# Physical asset CRUD, plus the serialization that broke GET /portfolios/ before

CAR = {
    "name": "2015 Toyota Camry",
    "category": "vehicle",
    "make": "Toyota",
    "model": "Camry",
    "year_made": 2015,
    "condition": "Good",
    "specs": { "mileage": 68000, "drivetrain": "FWD" },
    "initial_value": 14000.0,
    "purchase_year": 2021,
    "location": "Boston, MA",
    "details": "New tires last year",
}


def test_add_physical_asset( auth_client, portfolio ) :
    res = auth_client.post( f"/portfolios/{portfolio['id']}/physical-assets", json=CAR )
    assert res.status_code == 200
    body = res.json()
    assert body[ "name" ] == "2015 Toyota Camry"
    assert body[ "category" ] == "vehicle"
    # Not estimated yet, so the AI fields come back empty
    assert body[ "est_low" ] is None
    assert body[ "est_high" ] is None
    assert body[ "estimated_at" ] is None


def test_category_specific_specs_round_trip( auth_client, portfolio ) :
    # specs is a JSON column, so this checks the dict survives the DB round trip
    res = auth_client.post( f"/portfolios/{portfolio['id']}/physical-assets", json=CAR )
    assert res.json()[ "specs" ] == { "mileage": 68000, "drivetrain": "FWD" }


def test_only_name_category_value_and_year_are_required( auth_client, portfolio ) :
    res = auth_client.post( f"/portfolios/{portfolio['id']}/physical-assets", json={
        "name": "Grandma's ring",
        "category": "jewelry",
        "initial_value": 2000.0,
        "purchase_year": 1998,
    } )
    assert res.status_code == 200
    assert res.json()[ "make" ] is None


def test_missing_required_field_is_422( auth_client, portfolio ) :
    res = auth_client.post( f"/portfolios/{portfolio['id']}/physical-assets", json={
        "name": "Mystery item",
        "category": "other",
        # no initial_value or purchase_year
    } )
    assert res.status_code == 422


def test_physical_assets_serialize_on_the_portfolio( auth_client, portfolio ) :
    # Regression test: PortfolioOut used to reference PhysicalAssetOut before it
    # was defined and had no from_attributes, so this endpoint returned a 500.
    auth_client.post( f"/portfolios/{portfolio['id']}/physical-assets", json=CAR )
    res = auth_client.get( "/portfolios/" )
    assert res.status_code == 200
    items = res.json()[0][ "physical_assets" ]
    assert len( items ) == 1
    assert items[0][ "name" ] == "2015 Toyota Camry"


def test_portfolio_holds_stocks_and_items_together( auth_client, portfolio ) :
    auth_client.post( f"/portfolios/{portfolio['id']}/assets", json={
        "ticker": "AAPL", "shares": 2, "purchase_price": 100.0,
    } )
    auth_client.post( f"/portfolios/{portfolio['id']}/physical-assets", json=CAR )
    got = auth_client.get( "/portfolios/" ).json()[0]
    assert len( got[ "assets" ] ) == 1
    assert len( got[ "physical_assets" ] ) == 1


def test_add_physical_asset_to_missing_portfolio_is_404( auth_client ) :
    assert auth_client.post( "/portfolios/9999/physical-assets", json=CAR ).status_code == 404


def test_delete_physical_asset( auth_client, portfolio ) :
    added = auth_client.post( f"/portfolios/{portfolio['id']}/physical-assets", json=CAR ).json()
    res = auth_client.delete( f"/portfolios/{portfolio['id']}/physical-assets/{added['id']}" )
    assert res.status_code == 204
    assert auth_client.get( "/portfolios/" ).json()[0][ "physical_assets" ] == []


def test_delete_missing_physical_asset_is_404( auth_client, portfolio ) :
    assert auth_client.delete( f"/portfolios/{portfolio['id']}/physical-assets/9999" ).status_code == 404


def test_physical_assets_need_auth( client ) :
    assert client.post( "/portfolios/1/physical-assets", json=CAR ).status_code == 401
