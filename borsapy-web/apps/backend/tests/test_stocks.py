from __future__ import annotations


def test_search_stocks(client):
    response = client.get("/api/stocks/search?q=gar")
    assert response.status_code == 200
    body = response.json()
    assert body[0]["symbol"] == "AAA"


def test_search_stocks_missing_query(client):
    response = client.get("/api/stocks/search")
    assert response.status_code == 422


def test_get_stock_info(client):
    response = client.get("/api/stocks/AAA")
    assert response.status_code == 200
    body = response.json()
    assert body["symbol"] == "AAA"
    assert "last_price" in body


def test_get_stock_info_error(error_client):
    response = error_client.get("/api/stocks/AAA")
    assert response.status_code == 404


def test_get_stock_history(client):
    response = client.get("/api/stocks/AAA/history?period=1mo&interval=1d")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert body[0]["Date"] == "2024-01-01"


def test_get_stock_fast_info(client):
    response = client.get("/api/stocks/AAA/fast-info")
    assert response.status_code == 200
    body = response.json()
    assert body["symbol"] == "AAA"


def test_get_technicals(client):
    response = client.get("/api/stocks/AAA/technicals")
    assert response.status_code == 200
    body = response.json()
    assert "indicators" in body


def test_get_performance(client):
    response = client.get("/api/stocks/AAA/performance")
    assert response.status_code == 200
    body = response.json()
    assert "1w" in body
