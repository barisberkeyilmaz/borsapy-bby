from __future__ import annotations


def test_market_summary(client):
    response = client.get("/api/market/summary")
    assert response.status_code == 200
    body = response.json()
    assert "indices" in body
    assert body["indices"][0]["name"] == "XU100"


def test_market_summary_error(error_client):
    response = error_client.get("/api/market/summary")
    assert response.status_code == 500
