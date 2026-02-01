from __future__ import annotations


def test_compare_stocks_success(client):
    response = client.get("/api/compare/stocks?symbols=AAA,BBB")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2


def test_compare_stocks_min_symbols(client):
    response = client.get("/api/compare/stocks?symbols=AAA")
    assert response.status_code == 400


def test_compare_stocks_max_symbols(client):
    symbols = ",".join([f"S{i}" for i in range(11)])
    response = client.get(f"/api/compare/stocks?symbols={symbols}")
    assert response.status_code == 400


def test_compare_performance_success(client):
    response = client.get("/api/compare/performance?symbols=AAA,BBB&period=1y")
    assert response.status_code == 200
    body = response.json()
    assert body["symbols"] == ["AAA", "BBB"]


def test_compare_sector(client):
    response = client.get("/api/compare/sector/AAA")
    assert response.status_code == 200
    body = response.json()
    assert body["symbol"] == "AAA"
