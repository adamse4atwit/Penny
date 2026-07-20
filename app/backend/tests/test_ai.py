# AI insight request handling.
#
# Only covers the paths that return before Claude is called, so running the
# suite never spends API credits or needs a network connection.

def test_insight_needs_auth( client ) :
    assert client.post( "/ai/recommendations" ).status_code == 401


def test_empty_portfolio_gets_a_prompt_to_add_something( auth_client ) :
    res = auth_client.post( "/ai/recommendations" )
    assert res.status_code == 200
    body = res.json()
    assert "Add some assets" in body[ "headline" ]
    assert body[ "observations" ] == []
    assert body[ "suggestions" ] == []


def test_bad_risk_tolerance_is_rejected( auth_client ) :
    res = auth_client.post( "/ai/recommendations", json={ "risk_tolerance": "reckless" } )
    assert res.status_code == 422


def test_risk_tolerance_is_optional( auth_client ) :
    # No body at all should still work, it just gives more general advice
    assert auth_client.post( "/ai/recommendations" ).status_code == 200
    assert auth_client.post( "/ai/recommendations", json={} ).status_code == 200
